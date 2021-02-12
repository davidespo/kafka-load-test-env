
terraform {
  required_providers {
    aiven = {
      source  = "aiven/aiven"
      version = "2.1.6"
    }
  }
}

variable "AVN_TOKEN" {}
variable "PROJECT_DEST" {}
variable "KAFKA_TARGET" {}
variable "KAFKA_TARGET_PLAN" {}
variable "KAFKA_TARGET_VERSION" {}
variable "AVN_CLOUD" {
  type    = string
  default = "aws-us-west-2"
}

provider "aiven" {
  api_token = var.AVN_TOKEN
}

resource "aiven_kafka" "k" {
  project      = var.PROJECT_DEST
  cloud_name   = var.AVN_CLOUD
  plan         = var.KAFKA_TARGET_PLAN
  service_name = var.KAFKA_TARGET

  kafka_user_config {
    kafka_rest      = true
    kafka_connect   = true
    schema_registry = true
    kafka_version   = var.KAFKA_TARGET_VERSION

    kafka {
      # group_max_session_timeout_ms = 70000
      # log_retention_bytes          = 1000000000
      # auto_create_topics_enable = true
    }
  }

}

resource "aiven_grafana" "g" {
  project      = var.PROJECT_DEST
  cloud_name   = var.AVN_CLOUD
  plan         = "startup-4"
  service_name = "metrics-dashboard"
}

resource "aiven_influxdb" "i" {
  project      = var.PROJECT_DEST
  cloud_name   = var.AVN_CLOUD
  plan         = "startup-4"
  service_name = "metrics-influxdb"
}

resource "aiven_service_integration" "kafka-metrics" {
  project                  = var.PROJECT_DEST
  destination_service_name = aiven_influxdb.i.service_name
  integration_type         = "metrics"
  source_service_name      = aiven_kafka.k.service_name
}

resource "aiven_service_integration" "dashboards" {
  project                  = var.PROJECT_DEST
  source_service_name      = aiven_grafana.g.service_name
  integration_type         = "dashboard"
  destination_service_name = aiven_influxdb.i.service_name
}
