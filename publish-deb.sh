#!/bin/bash
set -e

bucket="openrov-software-nightlies"
folder="/cockpit"

contentType="application/x-compressed-tar"
dateValue=`date -R`
for f in *.deb; do
resource="/${bucket}${folder}/${f}"
stringToSign="PUT\n\n${contentType}\n${dateValue}\n${resource}"

signature=`echo -en ${stringToSign} | openssl sha1 -hmac ${s3Secret} -binary | base64`

echo "publishing https://${bucket}.s3.amazonaws.com${folder}/${f}"
curl -X PUT -T "${f}" \
  -H "Host: ${bucket}.s3.amazonaws.com" \
  -H "Date: ${dateValue}" \
  -H "Content-Type: ${contentType}" \
  -H "Authorization: AWS ${s3Key}:${signature}" \
  https://${bucket}.s3.amazonaws.com${folder}/${f}; done
