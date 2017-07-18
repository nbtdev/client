#!/bin/bash

DO_LOGIN=0
RESTART=0
TASK_DEFINITION=""
CLUSTER=""

while getopts "lr" opt; do
    case "$opt" in
    l) DO_LOGIN=1 ;;
    r) RESTART=1 ;;
    esac
done

# get git branch
BRANCH=`git rev-parse --abbrev-ref HEAD`

# turn BRANCH into tags
TAG=""

case $BRANCH in
    "master") 
        TAG="DEV"  
        CLUSTER="default" 
        ;;

    "production") 
        TAG="PROD" 
        CLUSTER="NBT-PROD" 
        ;;

    *) echo "On non-deployment branch $BRANCH, exiting"; exit 0 ;;
esac

TASK_DEFINITION="NBT-API-$TAG"

# login, if requested
if (( DO_LOGIN > 0 )); then
    $(aws ecr get-login --region us-west-2)
fi

# build the tagged image
docker build -t nbt-web:$TAG .

# deploy to AWS ECR
docker tag nbt-web:$TAG 068936280303.dkr.ecr.us-west-2.amazonaws.com/nbt-web:$TAG
docker push 068936280303.dkr.ecr.us-west-2.amazonaws.com/nbt-web:$TAG

# restart the tasks if requested
if (( RESTART > 0 )); then
    TASK=`aws ecs list-tasks --cluster=$CLUSTER | jq -rM '.["taskArns"][0]'`

    if [ "$TASK" != "null" ]
    then
        aws ecs stop-task --task $TASK
        sleep 5
    fi

    aws ecs run-task --task-definition $TASK_DEFINITION
fi

