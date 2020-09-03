#!groovy
import bcgov.GitHubHelper

// ---------------
// Pipeline Stages
// ---------------

// Run Tests
def runStageTests() {
  timeout(time: 10, unit: 'MINUTES') {
    parallel(
      App: {
        dir('app') {
          try {
            echo 'Installing NPM Dependencies...'
            sh 'npm ci'

            echo 'Linting and Testing App...'
            sh 'npm run test'

            echo 'App Lint Checks and Tests passed'
          } catch (e) {
            echo 'App Lint Checks and Tests failed'
            throw e
          }
        }
      },

      Frontend: {
        dir('app/frontend') {
          try {
            echo 'Installing NPM Dependencies...'
            sh 'npm ci'

            echo 'Linting and Testing Frontend...'
            sh 'npm run test'

            echo 'Frontend Lint Checks and Tests passed'
          } catch (e) {
            echo 'Frontend Lint Checks and Tests failed'
            throw e
          }
        }
      }
    )
  }
}

// Build Images & SonarQube Report
def runStageBuild() {
  openshift.withCluster() {
    openshift.withProject(TOOLS_PROJECT) {
      if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
        echo "DEBUG - Using project: ${openshift.project()}"
      }

      parallel(
        App: {
          try {
            notifyStageStatus('Build App', 'PENDING')

            echo "Processing BuildConfig ${REPO_NAME}-app-${JOB_NAME}..."
            def bcApp = openshift.process('-f',
              'openshift/app.bc.yaml',
              "REPO_NAME=${REPO_NAME}",
              "ROUTE_PATH=${PATH_ROOT}",
              "JOB_NAME=${JOB_NAME}",
              "SOURCE_REPO_URL=${SOURCE_REPO_URL}",
              "SOURCE_REPO_REF=${SOURCE_REPO_REF}"
            )

            echo "Building ImageStream..."
            openshift.apply(bcApp).narrow('bc').startBuild('-w').logs('-f')

            echo "Tagging Image ${REPO_NAME}-app:latest..."
            openshift.tag("${REPO_NAME}-app:latest",
              "${REPO_NAME}-app:${JOB_NAME}"
            )

            echo 'App build successful'
            notifyStageStatus('Build App', 'SUCCESS')
          } catch (e) {
            echo 'App build failed'
            notifyStageStatus('Build App', 'FAILURE')
            throw e
          }
        },

        SonarQube: {
          unstash APP_COV_STASH
          unstash FE_COV_STASH

          echo 'Performing SonarQube static code analysis...'
          sh """
          sonar-scanner \
            -Dsonar.host.url='${SONARQUBE_URL_INT}' \
            -Dsonar.projectKey='${REPO_NAME}-${JOB_NAME}' \
            -Dsonar.projectName='${APP_NAME} (${JOB_NAME.toUpperCase()})'
          """
        }
      )
    }
  }
}

// Deploy Application and Dependencies
def runStageDeploy(String stageEnv, String projectEnv, String hostEnv, String pathEnv) {
  if (!stageEnv.equalsIgnoreCase('Dev')) {
    input("Deploy to ${projectEnv}?")
  }

  openshift.withCluster() {
    openshift.withProject(projectEnv) {
      if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
        echo "DEBUG - Using project: ${openshift.project()}"
      }

      notifyStageStatus("Deploy - ${stageEnv}", 'PENDING')
      createDeploymentStatus(projectEnv, 'PENDING', JOB_NAME, hostEnv, pathEnv)

      echo "Checking for ConfigMaps and Secrets in project ${openshift.project()}..."
      if(!(openshift.selector('cm', "${APP_NAME}-frontend-config").exists() &&
      openshift.selector('cm', "${APP_NAME}-sc-config").exists() &&
      openshift.selector('cm', "${APP_NAME}-server-config").exists() &&
      openshift.selector('secret', "${APP_NAME}-keycloak-secret").exists() &&
      openshift.selector('secret', "${APP_NAME}-sc-cs-secret").exists())) {
        echo 'Some ConfigMaps and/or Secrets are missing. Please consult the openshift readme for details.'
        throw new Exception('Missing ConfigMaps and/or Secrets')
      }

      if(openshift.selector('secret', "patroni-${JOB_NAME}-secret").exists()) {
        echo "Patroni Secret already exists. Skipping..."
      } else {
        echo "Processing Patroni Secret..."
        def dcPatroniSecretTemplate = openshift.process('-f',
          'openshift/patroni.secret.yaml',
          "APP_DB_NAME=${APP_NAME}",
          "INSTANCE=${JOB_NAME}"
        )

        echo "Creating Patroni Secret..."
        openshift.create(dcPatroniSecretTemplate)
      }

      // Apply Patroni Database
      timeout(time: 10, unit: 'MINUTES') {
        def dcPatroniTemplate
        if(JOB_BASE_NAME.startsWith('PR-')) {
          echo "Processing Patroni StatefulSet (Ephemeral)..."
          dcPatroniTemplate = openshift.process('-f',
            'openshift/patroni-ephemeral.dc.yaml',
            "APP_NAME=${APP_NAME}",
            "INSTANCE=${JOB_NAME}",
            "NAMESPACE=${projectEnv}"
          )
        } else {
          echo "Processing Patroni StatefulSet (Persistent)..."
          dcPatroniTemplate = openshift.process('-f',
            'openshift/patroni.dc.yaml',
            "INSTANCE=${JOB_NAME}",
            "NAMESPACE=${projectEnv}"
          )
        }

        echo "Applying Patroni StatefulSet..."
        def dcPatroni = openshift.apply(dcPatroniTemplate).narrow('statefulset')
        dcPatroni.rollout().status('--watch=true')
      }

      // Wait for deployments to roll out
      timeout(time: 10, unit: 'MINUTES') {
        // Apply App Server
        echo "Tagging Image ${REPO_NAME}-app:${JOB_NAME}..."
        openshift.tag("${TOOLS_PROJECT}/${REPO_NAME}-app:${JOB_NAME}", "${REPO_NAME}-app:${JOB_NAME}")

        echo "Processing DeploymentConfig ${REPO_NAME}-app-${JOB_NAME}..."
        def dcAppTemplate = openshift.process('-f',
          'openshift/app.dc.yaml',
          "REPO_NAME=${REPO_NAME}",
          "JOB_NAME=${JOB_NAME}",
          "NAMESPACE=${projectEnv}",
          "APP_NAME=${APP_NAME}",
          "ROUTE_HOST=${hostEnv}",
          "ROUTE_PATH=${pathEnv}"
        )

        echo "Applying ${REPO_NAME}-app-${JOB_NAME} Deployment..."
        def dcApp = openshift.apply(dcAppTemplate).narrow('dc')
        dcApp.rollout().status('--watch=true')
      }
    }
  }
}

// --------------------
// Supporting Functions
// --------------------

// Notify stage status and pass to Jenkins-GitHub library
def notifyStageStatus(String name, String status) {
  def sha1 = GIT_COMMIT
  if(JOB_BASE_NAME.startsWith('PR-')) {
    sha1 = GitHubHelper.getPullRequestLastCommitId(this)
  }

  GitHubHelper.createCommitStatus(
    this, sha1, status, BUILD_URL, '', "Stage: ${name}"
  )
}

// Create deployment status and pass to Jenkins-GitHub library
def createDeploymentStatus(String environment, String status, String jobName, String hostEnv, String pathEnv) {
  def task = (JOB_BASE_NAME.startsWith('PR-')) ? "deploy:pull:${CHANGE_ID}" : "deploy:${jobName}"
  def ghDeploymentId = new GitHubHelper().createDeployment(
    this,
    SOURCE_REPO_REF,
    [
      'environment': environment,
      'task': task
    ]
  )

  new GitHubHelper().createDeploymentStatus(
    this,
    ghDeploymentId,
    status,
    ['targetUrl': "https://${hostEnv}${pathEnv}"]
  )

  if (status.equalsIgnoreCase('SUCCESS')) {
    echo "${environment} deployment successful at https://${hostEnv}${pathEnv}"
  } else if (status.equalsIgnoreCase('PENDING')) {
    echo "${environment} deployment pending..."
  } else if (status.equalsIgnoreCase('FAILURE')) {
    echo "${environment} deployment failed"
  }
}

// Creates a comment and pass to Jenkins-GitHub library
def commentOnPR(String comment) {
  if(JOB_BASE_NAME.startsWith('PR-')) {
    GitHubHelper.commentOnPullRequest(this, comment)
  }
}

return this
