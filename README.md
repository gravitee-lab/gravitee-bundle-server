# How to use

Two steps are required, and those two steps shloud be fully automated in a Circle CI Pipeline in this repo

## Get the static content

In the ./download.gravitee.io/ folder, populate the static files as explained in the


## Run the pulumi

* First, retrieve the pulumi credentials file :

```bash
$ ls -allh ~/.pulumi/
total 48K
drwxr-xr-x   6 jibl jibl 4.0K Sep  8 10:26 .
drwxr-xr-x 335 jibl jibl  20K Dec 24 02:42 ..
drwx------   2 jibl jibl 4.0K Sep  8 10:26 bin
-rw-------   1 jibl jibl   59 Sep 16 09:30 .cachedVersionInfo
-rw-r--r--   1 jibl jibl  418 Sep 16 11:43 credentials.json
drwx------  10 jibl jibl 4.0K Sep 16 11:44 plugins
drwx------  64 jibl jibl 4.0K Aug 25 11:28 templates
drwx------   2 jibl jibl 4.0K Sep 16 11:43 workspaces

```
* Install Pulumi  (will use a Pulumi OCI container image in the Circle CI pipeline, with a volume host bound to host folder `$HOME/.pulumi` )
* I will probably need to setup a pulumi backend to S3 to store the pulumi stack state, the jone we operate when we locally restore the pulumi stack state :

```bash
export PULUMI_STACK_NAME='gio_fargate'
export PULUMI_STACK_NAME='staging'

pulumi stack export -s "${PULUMI_STACK_NAME}" | pulumi stack import -s "${PULUMI_STACK_NAME}"
pulumi cancel
pulumi stack export -s "${PULUMI_STACK_NAME}" | pulumi stack import -s "${PULUMI_STACK_NAME}"
pulumi refresh --yes
```


* if the pulumi stack state does not exist (first pulumi execution to createthe project) :

```bash
# folder must be empty, path is up to you
export UR_PROJECT_HOME=$(pwd)/gravitee-bundle-server
# project and stack name are completely free of choice, below just examples
export PULUMI_PROJECT_NAME=download.gravitee.io
export PULUMI_STACK_NAME=dev
export PULUMI_STACK_NAME=prod
export PULUMI_STACK_NAME=staging

export GITHUB_ORG=gravitee-io
export GITHUB_ORG=gravitee-lab

git clone https://github.com/${GITHUB_ORG}/gravitee-bundle-server ${UR_PROJECT_HOME}

cd ${UR_PROJECT_HOME}/pulumi

# this will be interactive
pulumi new aws-typescript -n ${PULUMI_PROJECT_NAME} -s ${PULUMI_STACK_NAME} --dir ./temporary

# now we do not need $(pwd)/temporary folder any more :
# that was just to create the pulumi project in your https://pulumi.com user account
# [pulumi new command], has a GNU option name [--dir],  which defines the path of
# the folder where pulumi new command will generate files which we do not need.
rm -fr ./temporary


cp Pulumi.example_stack.yaml Pulumi.${PULUMI_STACK_NAME}.yaml
sed -i "s#prod-giooperator#${PULUMI_PROJECT_NAME}#g" Pulumi.${PULUMI_STACK_NAME}.yaml

npm install

export AWS_REGION=eu-west-1
# the AWS Profile you are using, you can check it in
# your ~/.aws/config and ~/.aws/credentials , in square brackets
# default if you do not use one in your ~/.aws/config and ~/.aws/credentials
export AWS_PROFILE=<the AWS Profile you are using, default if you do not use one>
export AWS_PROFILE=gio_fargate


pulumi config set aws:region "${AWS_REGION}"
pulumi config set aws:profile "${AWS_PROFILE}"


# Use [--secrets-provider] option to use your own secret manager , instead
# of Pulumi's default secret manager
# pulumi new aws-typescript -n ${PROJECT_NAME} -s ${PULUMI_STACK_NAME} --secrets-provider hashivault
pulumi login
```

* then :

```bash
export UR_PROJECT_HOME=$(pwd)/gravitee-bundle-server
# project and stack name are completely free of choice, below just examples
export PULUMI_PROJECT_NAME=download.gravitee.io
export PULUMI_STACK_NAME=dev
export PULUMI_STACK_NAME=prod
export PULUMI_STACK_NAME=staging

export GITHUB_ORG=gravitee-io
export GITHUB_ORG=gravitee-lab

# git clone and get all the zip files toserve with S3
git clone git@github.com:gravitee-io/dist.gravitee.io.git ${UR_PROJECT_HOME}/pulumi/download.gravitee.io
rm -fr ${UR_PROJECT_HOME}/pulumi/download.gravitee.io/.git/
# generate the hugo static website
rm -fr ${UR_PROJECT_HOME}/pulumi/hugo/download.gravitee.io
mkdir -p ${UR_PROJECT_HOME}/pulumi/hugo/download.gravitee.io
cp -fR ${UR_PROJECT_HOME}/pulumi/download.gravitee.io/* ${UR_PROJECT_HOME}/pulumi/download.gravitee.io/

cd ${UR_PROJECT_HOME}/pulumi/hugo
hugo
# add the generated website in the [download.gravitee.io/] folder
cp -fR ${UR_PROJECT_HOME}/pulumi/hugo/* ${UR_PROJECT_HOME}/pulumi/download.gravitee.io/

# and finally run the pulumi
cd ${UR_PROJECT_HOME}/pulumi
pulumi up
```

### Hugo dev mode

```bash
export UR_PROJECT_HOME=$(pwd)/gravitee-bundle-server

cd ${UR_PROJECT_HOME}/pulumi/hugo
hugo serve -b http://127.0.0.1:1313
```
