#!/bin/bash

DO_LOGIN=0

while getopts "l" opt; do
    case "$opt" in
    l) DO_LOGIN=1
       ;;
    esac
done

# get git branch
BRANCH=`git rev-parse --abbrev-ref HEAD`

# turn BRANCH into tags
TAG=""

case $BRANCH in
    "master") TAG="dev" ;;
    "production") TAG="prod" ;;
    *) echo "On non-deployment branch $BRANCH, exiting"; exit 0 ;;
esac

# login, if requested
if (( DO_LOGIN > 0 )); then
    $(aws ecr get-login --region us-west-2)
fi

# build the tagged image
docker build -t nbt-web:$TAG .

# deploy to AWS ECR
docker tag nbt-web:$TAG 068936280303.dkr.ecr.us-west-2.amazonaws.com/nbt-web:$TAG
docker push 068936280303.dkr.ecr.us-west-2.amazonaws.com/nbt-web:$TAG
