#!/bin/bash

release=clamav
namespace=clamav

helm template . --namespace $namespace --name-template $release > clamav.yaml
kubectl apply --namespace $namespace -f clamav.yaml
