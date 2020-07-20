#!/bin/bash

# Override the default command for the dockerfile
# To create local user and assign permissions to it.

export PATH="/opt/jboss/keycloak/bin:$PATH"

add_user () {
  export FIRST=$1
  export LAST=$2
  export USERNAME=`echo "$FIRST"_"$LAST" | tr A-Z a-z`
  export ROLENAME=$3
  export EMAIL="$USERNAME@email.com"

  echo "creating user $USERNAME..."

  USER_ID=`kcadm.sh create users -r $REALM -s username=$USERNAME -s firstName=$FIRST -s lastName=$LAST -s email=$EMAIL -i`
  kcadm.sh update users/$USER_ID -r $REALM -s enabled=true
  kcadm.sh set-password -r $REALM --username $USERNAME --new-password password123
  kcadm.sh add-roles -r $REALM --uusername $USERNAME --cclientid "comfort-agriseafoodopscreening" --rolename "$ROLENAME"
  kcadm.sh add-roles -r $REALM --uusername $USERNAME --cclientid "comfort-forestrysectoropscreening" --rolename "$ROLENAME"
  kcadm.sh add-roles -r $REALM --uusername $USERNAME --cclientid "comfort-minesoperatorscreening" --rolename "$ROLENAME"
  kcadm.sh add-roles -r $REALM --uusername $USERNAME --cclientid "comfort" --rolename "COMFORT User"

  echo "...$USERNAME created"
}

kcadm.sh config credentials --server http://localhost:8080/auth --realm master --user admin --password admin

export REALM=cp1qly2d

echo "creating admin for realm $REALM..."

USER_ID=`kcadm.sh create users -r $REALM -s username=admin -i`
kcadm.sh update users/$USER_ID -r $REALM -s enabled=true
kcadm.sh set-password -r $REALM --username admin --new-password admin
kcadm.sh add-roles -r $REALM --uusername admin --cclientid "comfort" --rolename "COMFORT Administrator"

echo "...$REALM admin created"

echo "add realm-admin to KEYCLOAK_REALM_ADMIN service account user..."
kcadm.sh add-roles -r $REALM --uusername service-account-keycloak_realm_admin --cclientid realm-management --rolename realm-admin
echo "...done"

add_user "CSST" "ROLE_1" "Form Administrator"
add_user "CSST" "ROLE_2" "Form Editor"
add_user "CSST" "ROLE_3" "Form Reviewer"
add_user "CSST" "ROLE_4" "Form Viewer"
add_user "CSST" "ROLE_5" "Request Access"

