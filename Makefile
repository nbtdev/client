DOCKER=docker
RM=rm -f 
NAME=nbt-web

LOGIN_CMD=$(shell aws ecr get-login)

#EXITED=$(shell $(DOCKER) ps --filter status=exited -q 2>/dev/null)
#DANGLING=$(shell $(DOCKER) images --filter dangling=true -q 2>/dev/null)

DOCKERFILE=Dockerfile
REPO=$(shell aws ecr describe-repositories --repository-names $(NAME) | jq -r '.repositories[].repositoryUri')

VERSION_FILE=version
VERSION=$(shell cat $(VERSION_FILE))

ifeq ($(strip $(VERSION)),)
	VERSION=0
endif

FILES=\
        Dockerfile \
        $(wildcard live/**) \
	version

.PHONY: cleanup login

web: $(FILES)
	$(DOCKER) build -t $(NAME):$(VERSION) -f $(DOCKERFILE) .
	$(DOCKER) tag $(NAME):$(VERSION) $(REPO):DEV
	$(DOCKER) push $(REPO):DEV
	@echo $$(($$(cat $(VERSION_FILE)) + 1)) > $(VERSION_FILE)
	touch $@

cleanup: 
	$(DOCKER) rm -v $(EXITED) 2>/dev/null
	$(DOCKER) rmi $(DANGLING) 2>/dev/null

login:
	$(LOGIN_CMD)

clean:
	$(RM) dev
