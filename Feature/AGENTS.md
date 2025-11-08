# Repository Guidelines

## Project Structure & Module Organization
`AI_Chatbot/` contains all source, configuration, and tests for this feature; treat other folders as tooling. Keep `.env_example` under version control, copy it to `.env`, and rely on `load_dotenv` instead of hard-coding secrets. Deployment helpers live in `AI_Chatbot/config/`, smoke probes live in `AI_Chatbot/test/respone_test.py`, and root `scripts/sagemaker_monitor.py` handles remote cleanup.

## Build, Test, and Development Commands
- `cd AI_Chatbot && pip install -r requirement.txt` installs all dependencies; rerun after editing the list.
- `python config/billing_toggle.py interactive` opens the guided CLI for listing, starting, or stopping endpoints, while `status`, `start --config`, and `stop --name` act as one-off commands.
- `python test/respone_test.py` runs the sample inference call against `llama-model` to confirm connectivity.
- `python ../scripts/sagemaker_monitor.py cleanup` (run from `AI_Chatbot/`) prunes duplicate HuggingFace deployments and prints their statuses.
- `black . && flake8` keep formatting and linting consistent before a PR.

## Coding Style & Naming Conventions
Use Python 3.11+, 4-space indentation, and snake_case modules such as `billing_toggle.py`. Add type hints where boto3 responses need clarity and reserve docstrings for public helpers instead of every tiny function. Format with `black` (line length 88), lint with `flake8`, keep constants uppercase, and load every secret from `os.environ` after `load_dotenv` rather than embedding them in code.

## Testing Guidelines
Run `cd AI_Chatbot && python -m pytest test` for the full suite, or add `-k <pattern>` to narrow the focus. Mirror code structure inside `test/` and cover both happy-path and error responses for every SageMaker call. Mock AWS clients with `pytest-mock` so automation stays offline; reserve `test/respone_test.py` for the live smoke scenario.

## Commit & Pull Request Guidelines
Write imperative, scope-prefixed commits such as `feat(chatbot): add endpoint cleanup guard` or `fix(config): load env from project root`. PRs need a short purpose summary, the commands you ran (`pip install`, `pytest`, smoke checks), links to any Jira/GitHub issue, and CLI output or screenshots if you touched the monitoring UX. Note deferred work in a “Follow-ups” list rather than TODOs, and confirm endpoints were stopped before merging.

## Security & Configuration Tips
Copy `.env_example` to `.env`, populate `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SAGEMAKER_EXECUTION_ROLE_ARN`, and `HF_TOKEN`, then run `aws configure` so boto3 can locate your default profile. Never commit `.env`, CloudWatch exports, or SageMaker logs. When testing new configs, use ephemeral endpoint names and clean them up with `billing_toggle.py stop` plus `scripts/sagemaker_monitor.py cleanup` to avoid surprise charges.
