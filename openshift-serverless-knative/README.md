# openshift-serverless-knative

This folder contains demos of [Red Hat OpenShift Serverless](https://www.redhat.com/en/technologies/cloud-computing/openshift/serverless), which is an enterprise grade Red Hat supported implementation of the upstream open source [Knative](https://knative.dev/docs/) project. The OpenShift Serverless operator is provided with [Full Lifecycle](https://sdk.operatorframework.io/docs/overview/operator-capabilities/) support. You can check out the [release notes here](https://docs.openshift.com/serverless/1.29/about/serverless-release-notes.html).

* Are you working on a clone or fork of this repo?
    * clone: you may follow the commands as is, the tekton pipelines will pull code from my github account
    * fork: you can update references to your own repo url by setting the `GITURL` variable below

### Assumptions

* Logged in to your ROSA or ARO cluster
* Able to install operators

### Install OpenShift Serverless

Follow the [instructions](https://docs.openshift.com/serverless/1.29/install/install-serverless-operator.html) to install the OpenShift Serverless operator. You will also need the [Knative cli](https://docs.openshift.com/serverless/1.29/install/installing-kn.html).

### Install OpenShift Pipelines (tekton)

Follow the [instructions](https://docs.openshift.com/container-platform/4.13/cicd/pipelines/installing-pipelines.html) to install the OpenShift Pipelines operator. We will use OpenShift Pipelines to build and deploy the Knative objects in the serverless project. We will deploy Knative Function, Knative Serving, and Knative Eventing objects to the cluster. You will also need the [Tekton cli](https://docs.openshift.com/container-platform/4.13/cli_reference/tkn_cli/installing-tkn.html).

### Set up variables

```console
# OCP Project name and git url
export PROJECT=serverless
export GITURL=https://github.com/MichaelMarkieta/mobb-demos

# Expose the image registry default route
oc patch configs.imageregistry.operator.openshift.io/cluster --patch '{"spec":{"defaultRoute":true}}' --type=merge

# Retrieve your OpenShift Image Registry route
export REGISTRY=$(oc get route -n openshift-image-registry -o yaml | yq -e ".items.[].spec.host")

# Log in to the OpenShift Image Registry
podman login -u openshift -p $(oc whoami -t) $REGISTRY
```

## Deploy a helloworld Knative Function

```console
cd function-helloworld

# Add extra tekton tasks to OpenShift Pipelines to support knative function build and deploy actions
oc apply -f https://raw.githubusercontent.com/openshift-knative/kn-plugin-func/serverless-1.29.0/pkg/pipelines/resources/tekton/task/func-s2i/0.1/func-s2i.yaml --namespace $PROJECT
oc apply -f https://raw.githubusercontent.com/openshift-knative/kn-plugin-func/serverless-1.29.0/pkg/pipelines/resources/tekton/task/func-deploy/0.1/func-deploy.yaml --namespace $PROJECT

# Replace registry, image, and giturl in func.yaml
yq -i ".registry = \"$REGISTRY/$PROJECT\"" func.yaml
yq -i ".image = \"$REGISTRY/$PROJECT/function-helloworld":"latest\"" func.yaml
yq -i ".git.url = \"$GITURL\"" func.yaml

# This will run automagically create a Tekton Pipeline on your cluster that will build and deploy your Knative Function
kn func deploy --remote --namespace $PROJECT
```

## Deploy a helloworld Knative Serving service

```console
cd serving-helloworld

# Add additional tekton tasks to OpenShift Pipelines to be used by our pipelines
oc apply -f https://raw.githubusercontent.com/tektoncd/catalog/main/task/kaniko/0.6/kaniko.yaml --namespace $PROJECT
oc apply -f https://raw.githubusercontent.com/tektoncd/catalog/main/task/yq/0.4/yq.yaml --namespace $PROJECT

# Update the PipelineRun manifest with the path to our OpenShift Image Registry and git url
yq -e -i "with(.spec.params ; filter(.name == \"imageUrl\").[] | .value = \"$REGISTRY/$PROJECT/serving-helloworld\")" pipelinerun.yaml
yq -e -i "with(.spec.params ; filter(.name == \"gitUrl\").[] | .value = \"$GITURL\")" pipelinerun.yaml

# Create the Pipeline
oc create -f pipeline.yaml --namespace $PROJECT

# Create a PipelineRun that will build and deploy your Knative Serving service
oc create -f pipelinerun.yaml --namespace $PROJECT --output yaml | export PIPELINERUN=$(yq ".metadata.name")

# Track the status of your PipelineRun
tkn pipelinerun describe $PIPELINERUN

# Get the logs from your PipelineRun
tkn pipelinerun logs $PIPELINERUN
...
[deploy-service : kn] Applying service 'serving-helloworld' in namespace 'serverless':
[deploy-service : kn]
[deploy-service : kn]   0.024s The Configuration is still working to reflect the latest desired specification.
[deploy-service : kn]   2.391s Traffic is not yet migrated to the latest revision.
[deploy-service : kn]   2.419s Ingress has not yet been reconciled.
[deploy-service : kn]   2.433s Waiting for load balancer to be ready
[deploy-service : kn]   2.637s Ready to serve.
[deploy-service : kn]
[deploy-service : kn] Service 'serving-helloworld' applied to latest revision 'serving-helloworld-00020' is available at URL:
[deploy-service : kn] https://serving-helloworld-serverless.apps.clustername.abc.xyz.openshiftapps.com

# You can see the result of the Knative service apply at the end of the successful PipelineRun
```

