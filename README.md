# Ephemeral Kafka Load Test Environment

## Setup

Rename `template.env` to `.env` and leave it in the root directory. Add the appropriate
projects, cluster names, and credentials.

```sh
AVN_TOKEN = "..."

# Primary Project, e.g. production
PROJECT_SRC = "..."

# Load Testing Project, e.g. load-test
PROJECT_DEST = "..."

# Production Cluster
KAFKA_SRC = "..."

# Load Test Cluster
KAFKA_TARGET = "..."

KAFKA_TARGET_PLAN = "business-32"
# KAFKA_TARGET_PLAN = "premium-6x-32"

KAFKA_TARGET_VERSION = "2.3"
# KAFKA_TARGET_VERSION = "2.6"
```

## Deploy The Kafka Cluster

```sh
$ terraform init
$ terraform apply --var-file=.env .
```

## Clone Kafka Topics

Use the provided binaries in the `bin` directory or run the node distribution file
in `dist/syncTopics.js`. Note that these scripts use the `.env` file for api credentials.

```sh
$ bin/syncTopics-macos
```

## Access Kafka Credentials

```sh
# Credential Files Only
$ avn service user-creds-download $KAFKA_SERVICE_NAME --username avnadmin --project $AVN_PROJECT
$ ls -1
ca.pem
service.cert
service.key

# Java Keystore/Truststore Utils
$ avn service user-kafka-java-creds $KAFKA_SERVICE_NAME --username avnadmin --project $AVN_PROJECT
$ ls -1
ca.pem
client.keystore.p12
client.properties
client.truststore.jks
service.cert
service.key
```

## Shutdown

### Poweroff

**Cost:** _$0 => Powered-off services do NOT incure usage fees_

**Note:** _Preserves Credentials_

This method turns off the cluster but does not remove it. That means that the
credentials with remain the same between provisioning the cluster. Note that
this will delete all topic meta and data. You will still need to `syncTopics`
after restarting.

```sh
avn service update --power-off $KAFKA_SERVICE_NAME --project $AVN_PROJECT
avn service update --power-off "metrics-dashboard" --project $AVN_PROJECT
avn service update --power-off "metrics-influxdb" --project $AVN_PROJECT

avn service update --power-on $KAFKA_SERVICE_NAME --project $AVN_PROJECT
avn service update --power-on "metrics-dashboard" --project $AVN_PROJECT
avn service update --power-on "metrics-influxdb" --project $AVN_PROJECT
```

### Delete

**Cost:** _$0_

This method turns completely deletes the cluster, credentials, topic meta,
and all data associated with it.

```sh
$ terraform destroy --var-file=.env .
```
