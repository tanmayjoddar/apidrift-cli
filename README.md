# Apidrift

A CLI tool to detect API schema drift across environments.

## Installation

```bash
npm install -g apidrift
```

## Usage

1.  **Initialize**

    Create a `apidrift.config.json` file in your project:

    ```bash
    apidrift init
    ```

    Edit this file to include your API environments and endpoints.

2.  **Snapshot**

    Take a snapshot of an environment:

    ```bash
    apidrift snapshot --tag v1.0 --env staging
    ```

3.  **Diff**

    Compare two snapshots:

    ```bash
    apidrift diff v1.0 v1.1
    ```

4.  **Check**

    Perform a live check between two environments:

    ```bash
    apidrift check --envA staging --envB prod
    ```

5.  **List**

    List all saved snapshots:

    ```bash
    apidrift list
    ```
