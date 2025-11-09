# Bitbucket Repository Clone Example

This guide demonstrates how to set up GitHub Actions to work with an existing Bitbucket repository that needs to be cloned before carrying out required work.

## Overview

When you need to work with code stored in a Bitbucket repository from within a GitHub Actions workflow, you'll need to:
1. Configure Bitbucket SSH access credentials as GitHub Secrets
2. Clone the Bitbucket repository in your workflow
3. Add any required environment files (e.g., `.env` files) that aren't in the repository
4. Perform your required operations on the cloned code

## Prerequisites

- A Bitbucket account with access to the repository you want to clone
- A GitHub repository where you'll run the workflow
- Admin access to configure secrets in your GitHub repository

## Step 1: Generate SSH Key for Bitbucket Access

**Note**: Bitbucket is phasing out App Password access, so SSH key authentication is the recommended method.

Generate an SSH key pair (without a passphrase) for GitHub Actions to use:

```bash
ssh-keygen -t ed25519 -C "github-actions" -f bitbucket_key -N ""
```

This creates two files:
- `bitbucket_key` - Private key (keep this secret!)
- `bitbucket_key.pub` - Public key (add to Bitbucket)

## Step 2: Add SSH Key to Bitbucket

1. Log in to your Bitbucket account
2. Click on your profile picture (bottom left) and select **Personal settings**
3. Navigate to **SSH keys** under "Security"
4. Click **Add key**
5. Copy the content of `bitbucket_key.pub` and paste it into the "Key" field
6. Give it a descriptive label (e.g., "GitHub Actions")
7. Click **Add key**

## Step 3: Configure GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

### Required Secrets

| Secret Name | Description | How to Get Value |
|------------|-------------|------------------|
| `BITBUCKET_SSH_KEY` | The private SSH key | Copy the entire content of `bitbucket_key` file (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`) |
| `BITBUCKET_REPO_SSH_URL` | The SSH clone URL of your Bitbucket repository | Go to your Bitbucket repo, click **Clone**, copy the SSH URL (e.g., `git@bitbucket.org:workspace/repo-name.git`) |

### Optional Secrets for Environment Files

If your cloned repository needs environment files (e.g., `.env`, `config.json`) to run tests or build:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `ENV_FILE_CONTENT` | Content of your .env file | `DATABASE_URL=postgres://...\nAPI_KEY=xyz123` |
| `CONFIG_FILE_CONTENT` | Content of configuration files | `{"api_url": "https://api.example.com"}` |

## Step 4: Create GitHub Actions Workflow

Create a workflow file in your GitHub repository at `.github/workflows/bitbucket-clone.yml`:

```yaml
name: Clone and Work with Bitbucket Repository

on:
  workflow_dispatch:  # Manual trigger
  push:
    branches: [ main ]
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight (optional)

jobs:
  clone-and-process:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout GitHub repository
        uses: actions/checkout@v4
      
      - name: Setup SSH for Bitbucket
        env:
          SSH_KEY: ${{ secrets.BITBUCKET_SSH_KEY }}
        run: |
          # Create .ssh directory
          mkdir -p ~/.ssh
          
          # Add SSH private key
          echo "$SSH_KEY" > ~/.ssh/bitbucket_key
          chmod 600 ~/.ssh/bitbucket_key
          
          # Add Bitbucket to known hosts
          ssh-keyscan bitbucket.org >> ~/.ssh/known_hosts
          
          # Configure SSH to use the key for Bitbucket
          cat << EOF > ~/.ssh/config
          Host bitbucket.org
            IdentityFile ~/.ssh/bitbucket_key
            StrictHostKeyChecking no
          EOF
      
      - name: Clone Bitbucket repository
        env:
          BITBUCKET_REPO_SSH_URL: ${{ secrets.BITBUCKET_REPO_SSH_URL }}
        run: |
          # Clone using SSH
          git clone $BITBUCKET_REPO_SSH_URL bitbucket-repo
          
          # Verify clone was successful
          if [ -d "bitbucket-repo/.git" ]; then
            echo "✓ Successfully cloned Bitbucket repository"
            cd bitbucket-repo
            git log --oneline -n 5
          else
            echo "✗ Failed to clone Bitbucket repository"
            exit 1
          fi
      
      - name: Add environment files to cloned repository
        env:
          ENV_FILE_CONTENT: ${{ secrets.ENV_FILE_CONTENT }}
          CONFIG_FILE_CONTENT: ${{ secrets.CONFIG_FILE_CONTENT }}
        run: |
          cd bitbucket-repo
          
          # Add .env file if ENV_FILE_CONTENT secret is set
          if [ ! -z "$ENV_FILE_CONTENT" ]; then
            echo "$ENV_FILE_CONTENT" > .env
            echo "✓ Created .env file"
          fi
          
          # Add config.json file if CONFIG_FILE_CONTENT secret is set
          if [ ! -z "$CONFIG_FILE_CONTENT" ]; then
            echo "$CONFIG_FILE_CONTENT" > config.json
            echo "✓ Created config.json file"
          fi
          
          # Example: Add other configuration files as needed
          # if [ ! -z "$OTHER_CONFIG" ]; then
          #   echo "$OTHER_CONFIG" > path/to/config.yaml
          # fi
      
      - name: Work with cloned repository
        run: |
          cd bitbucket-repo
          
          # Example: List files (including hidden files like .env)
          echo "Repository contents:"
          ls -la
          
          # Example: Run tests, build, or other operations
          # npm install
          # npm test
          # python -m pytest
          # make build
          
          # Add your custom operations here
          echo "Performing required work on the repository..."
      
      - name: Optional - Push changes back to Bitbucket
        if: false  # Set to true if you need to push changes
        run: |
          cd bitbucket-repo
          
          # Configure git user (required for commits)
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"
          
          # Make your changes here
          # echo "new content" > newfile.txt
          # git add .
          
          # Commit and push (SSH is already configured)
          # git commit -m "Automated changes from GitHub Actions"
          # git push origin main
```

## Step 5: Test the Workflow

1. Commit the workflow file to your GitHub repository
2. Go to **Actions** tab in your GitHub repository
3. Select the **Clone and Work with Bitbucket Repository** workflow
4. Click **Run workflow** to manually trigger it
5. Monitor the workflow execution and check the logs

## Advanced Configuration

### Using HTTPS with App Password (Legacy Method)

**Note**: Bitbucket is phasing out App Password access. Use SSH authentication (default method above) whenever possible.

If you need to use HTTPS authentication:

1. Create a Bitbucket App Password:
   - Go to **Personal settings** → **App passwords**
   - Click **Create app password**
   - Select **Repositories: Read** (and Write if needed)
   - Copy the generated password

2. Add these GitHub secrets:
   - `BITBUCKET_USERNAME`: Your Bitbucket username
   - `BITBUCKET_APP_PASSWORD`: The App Password
   - `BITBUCKET_REPO_URL`: HTTPS clone URL (e.g., `https://bitbucket.org/workspace/repo.git`)

3. Modify the clone step in your workflow:
   ```yaml
   - name: Clone Bitbucket repository via HTTPS
     env:
       BITBUCKET_USERNAME: ${{ secrets.BITBUCKET_USERNAME }}
       BITBUCKET_APP_PASSWORD: ${{ secrets.BITBUCKET_APP_PASSWORD }}
       BITBUCKET_REPO_URL: ${{ secrets.BITBUCKET_REPO_URL }}
     run: |
       REPO_URL_NO_PROTOCOL=$(echo $BITBUCKET_REPO_URL | sed 's|https://||')
       git clone https://${BITBUCKET_USERNAME}:${BITBUCKET_APP_PASSWORD}@${REPO_URL_NO_PROTOCOL} bitbucket-repo
   ```

### Cloning Specific Branch or Tag

To clone a specific branch:
```yaml
- name: Clone specific branch
  run: |
    git clone -b feature-branch $BITBUCKET_REPO_SSH_URL bitbucket-repo
```

To clone a specific tag:
```yaml
- name: Clone specific tag
  run: |
    git clone --branch v1.0.0 --depth 1 $BITBUCKET_REPO_SSH_URL bitbucket-repo
```

### Shallow Clone for Faster Operations

For large repositories, use a shallow clone to save time:
```yaml
- name: Shallow clone
  run: |
    git clone --depth 1 $BITBUCKET_REPO_SSH_URL bitbucket-repo
```

### Adding Multiple Environment Files

You can add multiple environment files by storing them as separate secrets:

```yaml
- name: Add multiple environment files
  env:
    ENV_FILE: ${{ secrets.ENV_FILE_CONTENT }}
    ENV_TEST_FILE: ${{ secrets.ENV_TEST_FILE_CONTENT }}
    DATABASE_CONFIG: ${{ secrets.DATABASE_CONFIG_CONTENT }}
  run: |
    cd bitbucket-repo
    
    # Add different environment files
    [ ! -z "$ENV_FILE" ] && echo "$ENV_FILE" > .env
    [ ! -z "$ENV_TEST_FILE" ] && echo "$ENV_TEST_FILE" > .env.test
    [ ! -z "$DATABASE_CONFIG" ] && echo "$DATABASE_CONFIG" > config/database.yml
    
    echo "✓ Environment files added"
```

### Using Environment Files from GitHub Repository

If your environment files are stored in your GitHub repository (not in the Bitbucket repo):

```yaml
- name: Copy environment files from GitHub repo
  run: |
    # Copy from your GitHub repo to the cloned Bitbucket repo
    cp .env.example bitbucket-repo/.env
    cp config/test-config.json bitbucket-repo/config/config.json
```

## Troubleshooting

### Permission Denied (SSH)

**Error**: `Permission denied (publickey)`

**Solutions**:
- Verify the SSH public key is added to your Bitbucket account under **Personal settings** → **SSH keys**
- Ensure the private key in GitHub secret `BITBUCKET_SSH_KEY` matches the public key in Bitbucket
- Check that the SSH key format is correct (include the full key with `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)
- Verify the key has correct permissions (the workflow sets `chmod 600`)
- Test that the SSH key works by manually cloning the repository

### Repository Not Found

**Error**: `fatal: repository 'git@bitbucket.org:workspace/repo.git' not found`

**Solutions**:
- Verify the repository SSH URL is correct (check for typos in workspace/repo name)
- Ensure your Bitbucket account has access to the repository
- For private repositories, confirm the SSH key is added to an account with access
- Check that the format is `git@bitbucket.org:workspace/repo-name.git`

### Authentication Failed (HTTPS)

**Error**: `fatal: Authentication failed for 'https://bitbucket.org/...'`

This error occurs when using the legacy HTTPS method.

**Solutions**:
- Switch to SSH authentication (recommended - see main workflow above)
- If you must use HTTPS: verify `BITBUCKET_USERNAME` and `BITBUCKET_APP_PASSWORD` are correct
- Check that the App Password has at least **Read** permission for repositories
- Verify the App Password hasn't expired or been revoked

### Rate Limiting

If you're cloning frequently, Bitbucket may rate-limit your requests:
- Use shallow clones (`--depth 1`) to reduce bandwidth
- Cache the cloned repository between workflow runs if possible
- Consider using a dedicated service account with higher rate limits

## Security Best Practices

1. **Never commit credentials to code**: Always use GitHub Secrets for SSH keys and sensitive information
2. **Use SSH keys**: SSH key authentication is more secure and is the recommended method
3. **Protect private keys**: Store SSH private keys only in GitHub Secrets, never in code or files
4. **Rotate credentials**: Periodically generate new SSH keys and update them in both Bitbucket and GitHub
5. **Minimum permissions**: Add SSH keys only to accounts that need repository access
6. **Audit access**: Review who has access to GitHub Secrets regularly
7. **Use environment secrets**: For organization-level workflows, use environment secrets with protection rules
8. **Environment files**: Store sensitive configuration data (API keys, database credentials) in GitHub Secrets, not in the repository

## Example Use Cases

- **Continuous Integration**: Clone Bitbucket repo to run tests in GitHub Actions with required `.env` files
- **Code Synchronization**: Sync code between Bitbucket and GitHub repositories
- **Multi-repository Builds**: Build projects that depend on code in Bitbucket, adding necessary config files
- **Automated Testing**: Run tests on Bitbucket code with environment-specific configurations
- **Code Analysis**: Run static analysis tools on Bitbucket-hosted code
- **Agent Task Execution**: Start automated agent tasks with all required environment files and credentials pre-configured

## Additional Resources

- [Bitbucket SSH Keys Documentation](https://support.atlassian.com/bitbucket-cloud/docs/set-up-an-ssh-key/)
- [Bitbucket App Passwords Documentation](https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/) (legacy method)
- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Git Clone Documentation](https://git-scm.com/docs/git-clone)

## Notes

- **SSH is the recommended authentication method** as Bitbucket is phasing out App Password access
- The workflow example uses Ubuntu runners, but you can adapt it for other runner types
- SSH keys and other credentials are masked in GitHub Actions logs for security
- Environment files added via secrets are not committed to the repository (unless explicitly done so)
- Consider using GitHub Actions caching to speed up repeated clones
- For production use, implement proper error handling and notifications
- You can start agent tasks with all required information pre-configured using this setup
