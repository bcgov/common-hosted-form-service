{{- define "nats.openshift.route.tls" -}}
{{- if (.Values.ess.nats.route.tls.enabled) -}}
tls:
    insecureEdgeTerminationPolicy: {{ .Values.ess.nats.route.tls.insecureEdgeTerminationPolicy }}
    termination: {{ .Values.ess.nats.route.tls.termination }}
{{- end -}}
{{- end -}}