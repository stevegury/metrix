#
# Tools
#
TOP		:= $(shell pwd)
NODE_MODULES	:= $(TOP)/node_modules
NODE_BIN	:= $(NODE_MODULES)/.bin
ESLINT		= $(NODE_BIN)/eslint
JSCS		= $(NODE_BIN)/jscs
MOCHA		= $(NODE_BIN)/mocha
IMOCHA		= $(NODE_BIN)/_mocha
ISTANBUL	= $(NODE_BIN)/istanbul
NPM		:= npm

#
# Files
#
#JS_FILES	:= $(wildcard $(TOP)/*.js $(TOP)/lib/**/*.js $(TOP)/test/**/*.js)
LIB_DIR		:= lib
BIN_DIR		:= bin
TEST_DIR	:= test
JS_FILES	:= $(shell find $(LIB_DIR) $(BIN_DIR) $(TEST_DIR) -name '*.js')
TEST_FILES	:= $(shell find $(TEST_DIR) -name '*.test.js')
SHRINKWRAP	:= npm-shrinkwrap.json

CLEAN_FILES	+= node_modules $(SHRINKWRAP)

#
# Repo-specific targets
#
.PHONY: all
all: node_modules check

.PHONY: lint
lint: node_modules $(ESLINT) $(JS_FILES)
	$(ESLINT) $(JS_FILES)

.PHONY: style
style: node_modules $(JSCS) $(JS_FILES)
	$(JSCS) $(JS_FILES)

.PHONY: fixstyle
fixstyle: node_modules $(JSCS) $(JS_FILES)
	$(JSCS) --fix $(JS_FILES)

.PHONY: cover
cover: node_modules $(ISTANBUL) $(IMOCHA)
	@rm -rf ./coverage
	$(ISTANBUL) cover --report html $(IMOCHA) -- $(TEST_FILES)

node_modules: package.json
	$(NPM) install -d
	@touch node_modules

.PHONY: test
test: node_modules $(MOCHA)
	$(MOCHA) --full-trace $(TEST_FILES)

.PHONY: check
check: lint style test cover

.PHONY: bench
bench:
	$(BIN_DIR)/bench.js

.PHONY: distclean
distclean:
	@rm -rf ./node_modules


#
# Debug -- print out a a variable via `make print-FOO`
#
print-%  : ; @echo $* = $($*)

