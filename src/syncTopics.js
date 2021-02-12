import betterLogging from 'better-logging';
import env from 'dotenv';
import _ from 'lodash';
import axios from 'axios';
import rateLimit from 'axios-rate-limit';

betterLogging(console);
env.config({ path: '.env' });

const AVN_TOKEN = process.env.AVN_TOKEN;
const PROJECT_SRC = process.env.PROJECT_SRC;
const PROJECT_DEST = process.env.PROJECT_DEST;
const KAFKA_SRC = process.env.KAFKA_SRC;
const KAFKA_TARGET = process.env.KAFKA_TARGET;

const http = rateLimit(axios.create(), { maxRPS: 10 });

const call = (token, url, method, data) =>
  http({
    url,
    method,
    headers: {
      authorization: `aivenv1 ${token}`,
    },
    data,
  });

async function fetchTopics(token, project, serviceName) {
  const res = await call(
    token,
    `https://api.aiven.io/v1/project/${project}/service/${serviceName}/topic`,
  );
  return _.get(res, 'data.topics', []).map((t) =>
    _.pick(t, [
      'cleanup_policy',
      'min_insync_replicas',
      'partitions',
      'replication',
      'retention_bytes',
      'retention_hours',
      'topic_name',
      'config',
    ]),
  );
}

async function createTopic(token, project, serviceName, topic, retryCount = 0) {
  const topicName = topic.topic_name;
  if (retryCount > 3) {
    console.error(`Failed to create topic "${topicName}". Aborting process`);
    process.exit(1);
  }
  try {
    const res = await call(
      token,
      `https://api.aiven.io/v1/project/${project}/service/${serviceName}/topic/${topicName}`,
    );
    if (!_.isNil(_.get(res, 'data.topic'))) {
      // topic already exists, nothing to do
      console.info(`Topic "${topicName}" already exists. Skipping`);
      return Promise.resolve(true);
    }
  } catch (err) {
    // 404, topic does not exist. We need to create it
  }
  try {
    await call(
      token,
      `https://api.aiven.io/v1/project/${project}/service/${serviceName}/topic`,
      'POST',
      topic,
    );
    return Promise.resolve(true);
  } catch (err) {
    console.error(`Error creating topic "${topicName}"`, err);
    return createTopic(token, project, serviceName, topic, retryCount + 1);
  }
}

async function syncTopics(
  token,
  srcProject,
  srcServiceName,
  destProject,
  destServiceName,
) {
  console.info(
    `Cloning topics from ${srcProject}@${srcServiceName} to ${destProject}@${destServiceName}`,
  );
  const topics = await fetchTopics(token, srcProject, srcServiceName);
  console.info(`Creating ${topics.length} topics.`);
  const startTime = Date.now();
  await Promise.all(
    topics.map((topic) =>
      createTopic(token, destProject, destServiceName, topic),
    ),
  );
  console.info(
    `Created ${topics.length} topics in ${(
      Date.now() - startTime
    ).toLocaleString()}ms`,
  );
}

syncTopics(AVN_TOKEN, PROJECT_SRC, KAFKA_SRC, PROJECT_DEST, KAFKA_TARGET);
