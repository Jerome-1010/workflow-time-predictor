# workflow-time-predictor

This action measures how long take time for the current workflow based on past results. This measurement is based on the history of the last 50 runs for the average, median, maximum, and minimum times when CI succeeds and fails, respectively.

## Expected Use Cases
- Notify users in advance when CI will be finished by notifying them of the values output from these github actions.
- Measure CI execution time and use for simple monitoring

## Inputs

| Input | Description | Required |
| ---- | ---- | ---- |
| `token` | Required to fetch workflow and repository information. Give `GITHUB_TOKEN`. | y |
| `owner` | Required to determine which repository to fetch. Give `GITHUB_REPOSITORY_OWNER`. | y |
| `repository` | Required to determine which repository to fetch. Give `GITHUB_REPOSITORY`. | y |
| `run-id` | Required to determine which workflow to fetch. Give `GITHUB_RUN_ID`. | y |
| `numbers` | The number of past results to fetch retroactively. Default value is `50`. | n |

## Outputs

| Output | Description | Unit |
| ---- | ---- | ---- |
| succeed_median_time | The median take time to run the workflow. | `minutes` |
| succeed_average_time | The average take time to run the workflow. | `minutes` |
| succeed_max_time | The max take time to run the workflow. | `minutes` |
| succeed_min_time | The min take time to run the workflow. | `minutes` |
| failure_median_time | The median take time to run the workflow. | `minutes` |
| failure_average_time | The average take time to run the workflow. | `minutes` |
| failure_max_time | The max take time to run the workflow. | `minutes` |
| failure_min_time | The min take time to run the workflow. | `minutes` |

## Example usage

```yaml
- name: Predict run time
  id: predict_run_time
  uses: jerome-1010/workflow-time-predictor@v1
  with:
    token: GITHUB_TOKEN
    owner: GITHUB_REPOSITORY_OWNER
    repository: GITHUB_REPOSITORY
    run-id: GITHUB_RUN_ID
- name: Noti expected run time
  run: echo "This workflow takes ${{steps.predict_run_time.outputs.succeed_average_time}} minutes if successful! If failed, this will fininsh in ${{steps.predict_run_time.outputs.failure_average_time}} on average."
```
