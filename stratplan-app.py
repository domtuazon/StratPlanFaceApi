from flask import Flask, render_template, json, request
from xml.etree import ElementTree
import http.client, urllib.parse, json
import vlc
import yagmail
#from pygame import mixer

app = Flask(__name__, static_url_path='/static')

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/face_api", methods=['POST'])
def handle_face_api():
    print(request.data)

    return 'OK'

@app.route("/send_email/<string_email_address>")
def send_email(string_email_address):
    yag = yagmail.SMTP('businessanalyticsUBP')
    to = string_email_address

    subject = 'Thank you for visiting our booth!'
    body = 'Have a nice day from the Business Analytics team'

    with open('email_templates/inline-email.html') as template:
        html = template.read()

    yag.send(to = to, subject = subject, contents = html)

    return 'OK'

@app.route("/handle_speech/<string_name>")
def handle_speech(string_name):
    apiKey = "133ebae720b84589a47fe301c3d8374e"

    params = ""
    headers = {"Ocp-Apim-Subscription-Key": apiKey}

    #AccessTokenUri = "https://api.cognitive.microsoft.com/sts/v1.0/issueToken";
    AccessTokenHost = "api.cognitive.microsoft.com"
    path = "/sts/v1.0/issueToken"

    # Connect to server to get the Access Token
    print ("Connect to server to get the Access Token")
    conn = http.client.HTTPSConnection(AccessTokenHost)
    conn.request("POST", path, params, headers)
    response = conn.getresponse()
    print(response.status, response.reason)

    data = response.read()
    conn.close()

    accesstoken = data.decode("UTF-8")
    print ("Access Token: " + accesstoken)

    body = ElementTree.Element('speak', version='1.0')
    body.set('{http://www.w3.org/XML/1998/namespace}lang', 'en-us')
    voice = ElementTree.SubElement(body, 'voice')
    voice.set('{http://www.w3.org/XML/1998/namespace}lang', 'en-US')
    voice.set('{http://www.w3.org/XML/1998/namespace}gender', 'Male')
    voice.set('name', 'Microsoft Server Speech Text to Speech Voice (en-US, BenjaminRUS)')
    voice.text = string_name

    headers = {"Content-type": "application/ssml+xml",
    			"X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
    			"Authorization": "Bearer " + accesstoken,
    			"X-Search-AppId": "07D3234E49CE426DAA29772419F436CA",
    			"X-Search-ClientID": "1ECFAE91408841A480F00935DC390960",
    			"User-Agent": "TTSForPython"}

    #Connect to server to synthesize the wave
    print ("\nConnect to server to synthesize the wave")
    conn = http.client.HTTPSConnection("speech.platform.bing.com")
    conn.request("POST", "/synthesize", ElementTree.tostring(body), headers)
    response = conn.getresponse()
    print(response.status, response.reason)

    data = response.read()
    print("The synthesized wave length: %d" %(len(data)))
    conn.close()

    f = open('name.mp3', 'wb')
    f.write(data)
    f.close()

    print('Playing text')
    p = vlc.MediaPlayer("name.mp3")
    p.play()
    #mixer.init()
    #mixer.music.load("name.mp3")
    #mixer.music.play()

    return 'Ok'

if __name__ == "__main__":
    app.debug = True
    app.run()
    app.run(debug = True)
