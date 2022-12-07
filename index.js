import {
  debug,
  getInput,
  setOutput,
  setFailed,
} from '@actions/core';
import { getOctokit } from '@actions/github';
import dayjs from 'dayjs';

async function getExecutionHistory(num, status) {
  const OWNER = getInput('owner');
  const REPO = getInput('repository').replace(`${OWNER}/`, '');
  const WORKFLOW_FILE_NAME = getInput('workflow-file-name');

  console.log(`
---------- Query Conditions ----------
  owner:              ${OWNER}
  repository:         ${REPO}
  workflow file name: ${WORKFLOW_FILE_NAME}
  status:             ${status}
  num:                ${num}
--------------------------------------
`);

  const octokit = getOctokit(getInput('token'));
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs', {
    owner: OWNER,
    repo: REPO,
    workflow_id: WORKFLOW_FILE_NAME,
    status,
    per_page: num,
  });
  if (typeof data === 'undefined') {
    throw new Error('Unexpected workflow history.');
  }
  return data.workflow_runs;
}

function getMedian(minutes) {
  let median;
  if (minutes.length % 2 === 0) {
    median = (minutes[Math.floor(minutes.length / 2)] + minutes[Math.floor(minutes.length / 2) + 1]) / 2;
  } else {
    median = minutes[Math.floor(minutes.length / 2)];
  }

  return median.toFixed(2);
}

async function covertHistoriesToResultAsStatus(num, status) {
  const history = await getExecutionHistory(num, status)
  if (!history.length) {
    console.log('The history not found.');
    return {
      median: 0,
      average: 0,
      max: 0,
      min: 0,
    }
  }

  const minutes = history.map(h => dayjs(h.updated_at).diff(dayjs(h.created_at), 'minute', true));
  // ascending
  minutes.sort((a, b) => a - b);

  debug(`
---------- Result Info ----------
  ${status} length: ${minutes.length}
  ${status} max:    ${minutes.slice(-1)[0]}
  ${status} min:    ${minutes[0]}v
---------------------------------
`);

  return {
    median: getMedian(minutes),
    average: (minutes.reduce((prev, curr) => prev + curr) / minutes.length).toFixed(2),
    max: minutes.slice(-1)[0].toFixed(2),
    min: minutes[0].toFixed(2),
  }
}

async function getCompletedResult(num) {
  const STATUS_COMPLETED = 'completed';
  return await covertHistoriesToResultAsStatus(num, STATUS_COMPLETED);
}

async function getFailureResult(num) {
  const STATUS_FAILURE = 'failure';
  return await covertHistoriesToResultAsStatus(num, STATUS_FAILURE);
}

try {
  const numbers = getInput('numbers');
  const MAX_NUMBERS = 100;
  if (numbers > MAX_NUMBERS) {
    throw new Error(`Given number is too large: ${numbers}. This must be ${MAX_NUMBERS} or less.`);
  }
  console.log(`🕑Getting ${numbers} execution history...`);

  Promise.all([
    getCompletedResult(numbers),
    getFailureResult(numbers),
  ]).then(([ completed, failure ]) => {
    const result = {
      succeed_median_time: completed.median,
      succeed_average_time: completed.average,
      succeed_max_time: completed.max,
      succeed_min_time: completed.min,
      failure_median_time: failure.median,
      failure_average_time: failure.average,
      failure_max_time: failure.max,
      failure_min_time: failure.min,
    }
    console.log('---------- Result ----------');
    Object.keys(result).forEach(k => {
      console.log(`${k}: ${result[k]} min`);
      setOutput(k, result[k]);
    });
    console.log('----------------------------');

    console.log('✨Done!');
  });
} catch (error) {
  setFailed(error.message);
}
