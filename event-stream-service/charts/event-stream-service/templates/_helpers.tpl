{{- define "nginx.openshift.route.tls" -}}
{{- if (.Values.ess.nginx.route.tls.enabled) -}}
tls:
    insecureEdgeTerminationPolicy: {{ .Values.ess.nginx.route.tls.insecureEdgeTerminationPolicy }}
    termination: {{ .Values.ess.nginx.route.tls.termination }}
{{- end -}}
{{- end -}}