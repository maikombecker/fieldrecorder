#!/bin/sh

DIR="$( cd -P "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR

cd web/

rsync -vr * dailyoperations@pulaski.dreamhost.com:sdb.phonologist.org/gravador

exit
