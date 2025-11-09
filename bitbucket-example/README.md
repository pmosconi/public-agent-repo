# Bitbucket Repository Clone Example

This guide demonstrates how to set up GitHub Actions to work with an existing Bitbucket repository that needs to be cloned before carrying out required work.

## Overview

When you need to work with code stored in a Bitbucket repository from within a GitHub Actions workflow, you'll need to:
1. Configure Bitbucket access credentials as GitHub Secrets
2. Clone the Bitbucket repository in your workflow
3. Perform your required operations on the cloned code

## Prerequisites

- A Bitbucket account with access to the repository you want to clone
- A GitHub repository where you'll run the workflow
- Admin access to configure secrets in your GitHub repository

## Step 1: Create Bitbucket App Password

To securely authenticate with Bitbucket, you'll need to create an App Password:

1. Log in to your Bitbucket account
2. Click on your profile picture (bottom left) and select **Personal settings**
3. Navigate to **App passwords** under "Access management"
4. Click **Create app password**
5. Give it a descriptive label (e.g., "GitHub Actions Access")
6. Select the following permissions:
   - **Repositories**: Read (minimum required for cloning)
   - Add **Write** if you need to push changes back to Bitbucket
7. Click **Create**
8. **Important**: Copy the generated password immediately - you won't be able to see it again!

## Step 2: Configure GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

### Required Secrets

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `BITBUCKET_USERNAME` | Your Bitbucket username | `john.doe` |
| `BITBUCKET_APP_PASSWORD` | The App Password created in Step 1 | `ATBBXXXXXXXXXXXXxxx` |
| `BITBUCKET_REPO_URL` | The HTTPS clone URL of your Bitbucket repository | `https://bitbucket.org/workspace/repo-name.git` |

**Note**: You can find the repository URL by:
- Going to your Bitbucket repository
- Clicking the **Clone** button
- Copying the HTTPS URL (not SSH)

## Step 3: Create GitHub Actions Workflow

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
      
      - name: Clone Bitbucket repository
        env:
          BITBUCKET_USERNAME: ${{ secrets.BITBUCKET_USERNAME }}
          BITBUCKET_APP_PASSWORD: ${{ secrets.BITBUCKET_APP_PASSWORD }}
          BITBUCKET_REPO_URL: ${{ secrets.BITBUCKET_REPO_URL }}
        run: |
          # Create a directory for the Bitbucket repository
          mkdir -p bitbucket-repo
          
          # Extract repository URL without protocol
          REPO_URL_NO_PROTOCOL=$(echo $BITBUCKET_REPO_URL | sed 's|https://||')
          
          # Clone using credentials in URL
          git clone https://${BITBUCKET_USERNAME}:${BITBUCKET_APP_PASSWORD}@${REPO_URL_NO_PROTOCOL} bitbucket-repo
          
          # Verify clone was successful
          if [ -d "bitbucket-repo/.git" ]; then
            echo "✓ Successfully cloned Bitbucket repository"
            cd bitbucket-repo
            git log --oneline -n 5
          else
            echo "✗ Failed to clone Bitbucket repository"
            exit 1
          fi
      
      - name: Work with cloned repository
        run: |
          cd bitbucket-repo
          
          # Example: List files
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
        env:
          BITBUCKET_USERNAME: ${{ secrets.BITBUCKET_USERNAME }}
          BITBUCKET_APP_PASSWORD: ${{ secrets.BITBUCKET_APP_PASSWORD }}
        run: |
          cd bitbucket-repo
          
          # Configure git user (required for commits)
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"
          
          # Make your changes here
          # echo "new content" > newfile.txt
          # git add .
          
          # Commit and push
          # git commit -m "Automated changes from GitHub Actions"
          # git push origin main
```

## Step 4: Test the Workflow

1. Commit the workflow file to your GitHub repository
2. Go to **Actions** tab in your GitHub repository
3. Select the **Clone and Work with Bitbucket Repository** workflow
4. Click **Run workflow** to manually trigger it
5. Monitor the workflow execution and check the logs

## Advanced Configuration

### Using SSH Instead of HTTPS

If you prefer to use SSH for cloning:

1. Generate an SSH key pair (without a passphrase):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions" -f bitbucket_key -N ""
   ```

2. Add the public key (`bitbucket_key.pub`) to your Bitbucket account:
   - Go to **Personal settings** → **SSH keys**
   - Click **Add key** and paste the public key content

3. Add the private key as a GitHub secret named `BITBUCKET_SSH_KEY`

4. Modify your workflow:
   ```yaml
   - name: Setup SSH for Bitbucket
     env:
       SSH_KEY: ${{ secrets.BITBUCKET_SSH_KEY }}
     run: |
       mkdir -p ~/.ssh
       echo "$SSH_KEY" > ~/.ssh/bitbucket_key
       chmod 600 ~/.ssh/bitbucket_key
       ssh-keyscan bitbucket.org >> ~/.ssh/known_hosts
       
       # Configure SSH to use the key
       cat << EOF > ~/.ssh/config
       Host bitbucket.org
         IdentityFile ~/.ssh/bitbucket_key
         StrictHostKeyChecking no
       EOF
   
   - name: Clone Bitbucket repository via SSH
     run: |
       git clone git@bitbucket.org:workspace/repo-name.git bitbucket-repo
   ```

### Cloning Specific Branch or Tag

To clone a specific branch:
```yaml
- name: Clone specific branch
  run: |
    git clone -b feature-branch https://${BITBUCKET_USERNAME}:${BITBUCKET_APP_PASSWORD}@${REPO_URL_NO_PROTOCOL} bitbucket-repo
```

To clone a specific tag:
```yaml
- name: Clone specific tag
  run: |
    git clone --branch v1.0.0 --depth 1 https://${BITBUCKET_USERNAME}:${BITBUCKET_APP_PASSWORD}@${REPO_URL_NO_PROTOCOL} bitbucket-repo
```

### Shallow Clone for Faster Operations

For large repositories, use a shallow clone to save time:
```yaml
- name: Shallow clone
  run: |
    git clone --depth 1 https://${BITBUCKET_USERNAME}:${BITBUCKET_APP_PASSWORD}@${REPO_URL_NO_PROTOCOL} bitbucket-repo
```

## Troubleshooting

### Authentication Failed

**Error**: `fatal: Authentication failed for 'https://bitbucket.org/...'`

**Solutions**:
- Verify that `BITBUCKET_USERNAME` is your Bitbucket username (not email)
- Ensure `BITBUCKET_APP_PASSWORD` is correctly copied (no extra spaces)
- Check that the App Password has at least **Read** permission for repositories
- Verify the App Password hasn't expired or been revoked

### Repository Not Found

**Error**: `fatal: repository 'https://bitbucket.org/workspace/repo.git/' not found`

**Solutions**:
- Verify the repository URL is correct (check for typos)
- Ensure your Bitbucket account has access to the repository
- For private repositories, confirm the App Password has appropriate permissions
- Check that the workspace name and repository name are correct

### Permission Denied

**Error**: `Permission denied (publickey)` (when using SSH)

**Solutions**:
- Verify the SSH public key is added to your Bitbucket account
- Ensure the private key in GitHub secrets matches the public key in Bitbucket
- Check that the SSH key format is correct (include the full key with header/footer)

### Rate Limiting

If you're cloning frequently, Bitbucket may rate-limit your requests:
- Use shallow clones (`--depth 1`) to reduce bandwidth
- Cache the cloned repository between workflow runs if possible
- Consider using a dedicated service account with higher rate limits

## Security Best Practices

1. **Never commit credentials to code**: Always use GitHub Secrets for sensitive information
2. **Use App Passwords**: Don't use your main Bitbucket password
3. **Minimum permissions**: Grant only the permissions needed (Read for cloning)
4. **Rotate credentials**: Periodically update App Passwords
5. **Audit access**: Review who has access to GitHub Secrets regularly
6. **Use environment secrets**: For organization-level workflows, use environment secrets with protection rules

## Example Use Cases

- **Continuous Integration**: Clone Bitbucket repo to run tests in GitHub Actions
- **Code Synchronization**: Sync code between Bitbucket and GitHub repositories
- **Multi-repository Builds**: Build projects that depend on code in Bitbucket
- **Automated Backups**: Regular backups of Bitbucket repositories to other locations
- **Code Analysis**: Run static analysis tools on Bitbucket-hosted code

## Additional Resources

- [Bitbucket App Passwords Documentation](https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/)
- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Git Clone Documentation](https://git-scm.com/docs/git-clone)

## Notes

- The workflow example uses Ubuntu runners, but you can adapt it for other runner types
- Credentials are masked in GitHub Actions logs for security
- Consider using GitHub Actions caching to speed up repeated clones
- For production use, implement proper error handling and notifications
