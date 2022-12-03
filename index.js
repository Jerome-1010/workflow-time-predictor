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
  const RUN_ID = getInput('run-id');

  const octokit = getOctokit({ token: getInput('token') });
  const { workflowID } = await octokit.request('GET /repos/{owner}/{repo}/actions/runs/{run_id}{?exclude_pull_requests}', {
    owner: OWNER,
    repo: REPO,
    run_id: RUN_ID,
  });

  debug(`
---------- Query Conditions ----------
  owner:        ${OWNER}
  repository:   ${REPO}
  run id:       ${RUN_ID}
  workflow id:  ${workflowID}
  status:       ${status}
  num:          ${num}
---------- Query Conditions ----------
`);

  return await octokit.request('GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs{?status,per_page}', {
    owner: OWNER,
    repo: REPO,
    workflow_id: workflowID,
    status,
    per_page: num,
  });
}

async function covertHistoriesToResultAsStatus(num, status) {
  const minutes = getExecutionHistory(num, status).reduce(
    (previous, current) => dayjs(current.created_at).diff(dayjs(current.updated_at), 'minute', true)
  );
  // ascending
  minutes.sort((a, b) => a - b);

  debug(`
---------- Result Info ----------
  ${status} length: ${minutes.length}
  ${status} max:    ${minutes.slice(-1)[0]}
  ${status} min:    ${minutes[0]}v
---------- Result Info ----------
`);

  return {
    median: minutes[Math.floor(minutes.length / 2)],
    average: minutes.reduce((prev, curr) => prev + curr) / minutes.length,
    max: minutes.slice(-1)[0],
    min: minutes[0],
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
    debug(`result: ${result}`);
    result.keys().forEach(k => {
      setOutput(k, result[k]);
    })

    console.log('✨Done!')
  });
} catch (error) {
  setFailed(error.message);
}
