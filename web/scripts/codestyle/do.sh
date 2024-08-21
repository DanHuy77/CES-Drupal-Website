#!/usr/bin/env bash

# Directories.
SCRIPTNAME="$( basename "${BASH_SOURCE[0]}" )"
SCRIPTPATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT="$( dirname $( dirname ${SCRIPTPATH} ) )"
NAME=${SCRIPTPATH:${#ROOT}+1}

# Read configs.
source "${SCRIPTPATH}/config.sh"

REPOROOT=$( dirname ${ROOT} )
if [ -d "${REPOROOT}" ]; then
  pushd "${REPOROOT}"
    # Iterate.
    for FILEPATH in "${FILEPATHS[@]}"
    do
      echo "Processing ${FILEPATH}"

      case $1 in
      prettier)
        npm run prettier -- ${FILEPATH}
        ;;
      prettier-fix)
        npm run prettier-fix -- ${FILEPATH}
        ;;
      stylelint)
        npm run stylelint -- ${FILEPATH}
        ;;
      stylelint-fix)
        npm run stylelint-fix -- ${FILEPATH}
        ;;
      eslint)
        npm run eslint -- ${FILEPATH}
        ;;
      eslint-fix)
        npm run eslint-fix -- ${FILEPATH}
        ;;
      phpcs)
        npm run phpcs -- ${FILEPATH}
        ;;
      phpcs-fix)
        npm run phpcs-fix -- ${FILEPATH}
        ;;
      esac
    done

    # Prettier.
    # ./node_modules/.bin/prettier --check

  popd
fi

