import requests
import os, os.path

# Change this to folder of images to be uploaded
# As well as the personId of the user

personId = "d32eb198-1152-4652-99d0-b398c5c76a78"
DIR = "./face_images/Eugene Acevedo"
url = "https://westus.api.cognitive.microsoft.com/face/v1.0/persongroups/{personGroupId}/persons/{personId}/persistedFaces"

url = url.format(personGroupId="ubpstratplan",personId=personId)

print(url)

headers = {
    "Content-Type": "application/octet-stream",
    "Ocp-Apim-Subscription-Key": "0f7dacb02cb946df8da0241615c13e36"
}

for img in os.listdir(DIR):
    r = requests.post(url, data=open('{0}/{1}'.format(DIR, img), 'rb'), headers=headers)
    print(r.text)
