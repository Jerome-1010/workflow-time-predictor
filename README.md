# workflow-time-predictor

This action measures how long take time for the current workflow based on past results. This measurement is based on the history of the last 50 runs for the average, median, maximum, and minimum times when CI succeeds and fails, respectively.

## Expected Use Cases
- Notify users in advance when CI will be finished by notifying them of the values output from these github actions.
- Measure CI execution time and use for simple monitoring

## Inputs

| Input | Description | Required |
| ---- | ---- | ---- |
| `token` | Required to fetch workflow and repository information. Give `${{ secrets.GITHUB_TOKEN }}`. | y |
| `owner` | Required to determine which repository to fetch. Give `${{ github.repository_owner }}`. | y |
| `repository` | Required to determine which repository to fetch. Give `${{ github.repository_owner }}`. | y |
| `workflow-file-name` | Required to determine which repository to fetch. Give `build.yml` if your workflow file name is build.yml. | y |
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

```yml:build.yml
- name: Predict run time
  id: predict_run_time
  uses: jerome-1010/workflow-time-predictor@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    owner: ${{ github.repository_owner }}
    repository: ${{ github.repository_owner }}
    workflow-file-name: "build.yml"
- name: Noti expected run time
  run: echo "succeed_median_time is ${{steps.predict_run_time.outputs.succeed_median_time}}"
```

Or you can also see the results output on the job details page as well.
```
---------- Result ----------
succeed_median_time: 0.23 min
succeed_average_time: 18.91 min
succeed_max_time: 461.60 min
succeed_min_time: 0.00 min
failure_median_time: 0.22 min
failure_average_time: 7.35 min
failure_max_time: 180.32 min
failure_min_time: 0.00 min
----------------------------
```
