FROM golang:1.23

RUN go install github.com/nats-io/nkeys/nk@latest \
    && addgroup --system nonroot \
    && adduser --system nonroot --ingroup nonroot

USER nonroot

ENTRYPOINT ["nk", "-gen", "user", "-pubout"]
