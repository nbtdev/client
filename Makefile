RM=rm -f 
NAMES=\
	nbt-web \
	nbt-automation

LOGIN_CMD=$(shell aws ecr get-login)

LANDING_FILES=\
	Dockerfile-LANDING \
	$(wildcard landing/**)

AUTOMATION_FILES=\
	Dockerfile-AUTOMATION \
	$(wildcard automation/**)

.PHONY: cleanup login $(NAMES)

all: $(NAMES) 

nbt-web: $(wildcard landing/**)
	./build.sh $@

nbt-automation: $(wildcard automation/**)
	./build.sh $@

cleanup: 
	$(DOCKER) rm -v $(EXITED) 2>/dev/null
	$(DOCKER) rmi $(DANGLING) 2>/dev/null

login:
	$(LOGIN_CMD)

clean:
	$(RM) dev
