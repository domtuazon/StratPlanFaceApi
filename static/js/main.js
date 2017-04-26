var refreshRate = 1500 // every 3
var playing = true;
// Elements for taking the snapshot
var canvas = document.getElementById('canvas');
var resultsCanvas = document.getElementById('results')
var context = canvas.getContext('2d');
var resultsContext = resultsCanvas.getContext('2d');
var video = document.getElementById('video');
var currentFace = [];
var averageAge = [];
var genderArr = [];
var pauseCapture = null;


$(document).ready(function() {
    // Grab elements, create settings, etc.
    var video = document.getElementById('video');

    // Get access to the camera!
    if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Not adding `{ audio: true }` since we only want video now
        navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
            video.src = window.URL.createObjectURL(stream);
            video.play();

            startCapture();
        });
    }

    $('#pause').on('click', function() {
        if (playing) {
            playing = false;
            // alert(playing)
            // startCapture();
        } else {
            playing = true;
            // alert(playing)
        }
    });

});



function startCapture() {
    // Capture a photo every n seconds. (n = refreshRate set)
    setTimeout(function() {
        resultsContext.clearRect(0,0,resultsCanvas.width, resultsCanvas.height);
        var vidWidth = $('#video').width();
        var vidHeight = $('#video').height();

        context.canvas.width = vidWidth;
        context.canvas.height = vidHeight;
        resultsContext.canvas.width = vidWidth;
        resultsContext.canvas.height = vidHeight;
        resultsContext.strokeStyle="yellow";
        resultsContext.lineWidth = "7";

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // var imgByte = context.getImageData(0, 0, 640, 480);

        var imgByte = canvas.toDataURL('image/JPEG')
        // console.log(imgByte)
        if (playing) {
            sendToFaceApi(imgByte);
        } else {
            // alert('stopped');
            console.log('stopped');
        }

    }, refreshRate)
}

function sendToFaceApi(imgByte) {

    var params = {
        // Request parameters
        "returnFaceId": "true",
        "returnFaceLandmarks": "true",
        "returnFaceAttributes": "age,gender,smile,glasses",
    };

    $.ajax({
        url: "https://westus.api.cognitive.microsoft.com/face/v1.0/detect?" + $.param(params),
        beforeSend: function(xhrObj){
            // Request headers
            // xhrObj.setRequestHeader("Content-Type","application/json");
            xhrObj.setRequestHeader("Content-Type","application/octet-stream");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key","0f7dacb02cb946df8da0241615c13e36");
        },
        type: "POST",
        // Request body
        data: makeblob(imgByte),
        processData: false
    })
    .done(function(data) {
        console.log(data);
        if(data[0]) {
            drawFaceRectangle(data);
            checkMatchedFaces(data);
            getAdsByDemographic(data[0].faceAttributes.age, data[0].faceAttributes.gender)
        }

        startCapture();
    })
    .fail(function(err) {
        console.log(err)
        // alert("error");
    });
}

// Male ads by age
var maleAds = [
    {
        "maxAge": 25,
        "minAge": 0,
        "ads": [
            "cards.jpg",
            "commute.jpg",
            "general.jpg",
            "travel6.jpg"
        ]
    },
    {
        "maxAge": 35,
        "minAge": 26,
        "ads": [
            "travel.jpg",
            "travel2.jpg",
            "travel4.jpg",
            "travel5.jpg"
        ]
    },
    {
        "maxAge": 99,
        "minAge": 36,
        "ads": [
            "house.jpg",
            "travel-hotel.jpg",
            "travel6.jpg",
            "travel7.jpg"
        ]
    }
]

var femaleAds = [
    {
        "maxAge": 25,
        "minAge": 0,
        "ads": [
            "general2.jpg",
            "shopping3.jpg",
            "shopping5.jpg"
        ]
    },
    {
        "maxAge": 35,
        "minAge": 26,
        "ads": [
            "cars.jpg",
            "fashion2.jpg"
        ]
    },
    {
        "maxAge": 99,
        "minAge": 36,
        "ads": [
            "dining.jpg",
            "gadget.jpg",
            "shopping1.jpg",
            "shopping4.jpg"
        ]
    }
]

function getRandomRange(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

var getAdsByDemographic = function(age, gender) {
    console.log('age is: ' + age);
    console.log('gender is: ' + gender);
    var adImage = 'travel.jpg';

    if(gender == 'male') {
        if(age < 25) {
            adImage = maleAds[0].ads[getRandomRange(0, maleAds[0].ads.length - 1)]
        } else if (age < 35) {
            adImage = maleAds[1].ads[getRandomRange(0, maleAds[1].ads.length - 1)]
        } else {
            adImage = maleAds[2].ads[getRandomRange(0, maleAds[2].ads.length - 1)]
        }
    } else {
        if(age < 25) {
            adImage = femaleAds[0].ads[getRandomRange(0, femaleAds[0].ads.length - 1)]
        } else if (age < 35) {
            adImage = femaleAds[1].ads[getRandomRange(0, femaleAds[1].ads.length - 1)]
        } else {
            adImage = femaleAds[2].ads[getRandomRange(0, femaleAds[2].ads.length - 1)]
        }
    }

    console.log(adImage);
    // set background ads
    $('#custom-ad').prop('src', '/static/images/' + adImage);
    $('.custom-ads-wrapper').removeClass('initial showcase');
    $('#video-holder').switchClass('col-md-6 col-md-offset-3', 'col-md-4');

    // Set timer so background remains


}

var makeblob = function (dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = decodeURIComponent(parts[1]);
        return new Blob([raw], { type: contentType });
    }
    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}

var checkMatchedFaces = function(data) {
    // console.log('this one');
    // console.log(data);
    var faceId = data[0].faceId;
    averageAge.push(data[0].faceAttributes.age);
    genderArr.push(data[0].faceAttributes.gender);
    params = {
        "faceIds": [faceId],
        "personGroupId": "ubpstratplan",
    }
    $.ajax({
        url: "https://westus.api.cognitive.microsoft.com/face/v1.0/identify",
        beforeSend: function(xhrObj){
            // Request headers
            xhrObj.setRequestHeader("Content-Type","application/json");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key","0f7dacb02cb946df8da0241615c13e36");
        },
        type: "POST",
        data: JSON.stringify(params)
    })
    .done(function(data) {
        console.log(data);

        if(data.length > 0) {

            // Check if matched face is at least 60% confident

            var confidenceScore = data[0].candidates[0].confidence;

            if(confidenceScore > 0.6) {

                var personId = data[0].candidates[0].personId;

                console.log("Matched Faces found!")
                console.log(data);

                if(currentFace.length > 2 && playing) {
                    // Get Name and Say the Name
                    getMatchedFaceName(currentFace[0]);

                    // reset everything
                    // $('#custom-ad').prop('src', '/static/images/background.jpg');
                    // $('.custom-ads-wrapper').addClass('initial showcase');
                    // $('#video-holder').switchClass('col-md-4', 'col-md-6 col-md-offset-3');

                    handleProgressBar.setWidth(0);
                    currentFace.length = 0;
                    averageAge.length = 0;
                    genderArr.length = 0;

                    // Pause the capturing
                    playing = false;
                    // Start capturing again after 8 seconds
                    setTimeout(function() {
                        playing = true;
                        startCapture();

                    }, 15000);
                } else if(currentFace.length > 0) {
                    if(currentFace[0] == personId) {
                        currentFace.push(personId);
                    } else {
                        currentFace = [];
                    }
                } else {
                    currentFace.push(personId);
                }
                handleProgressBar.setWidth( (currentFace.length > 3 ? 3 : currentFace.length) / 3);
            }

        } else {
            // Face wasn't detected
        }


    })
    .fail(function(err) {
        console.log(err)
        // alert("error");
    });
}

var getMatchedFaceName = function(persistentFaceId) {
    // Pull this from DB next time
    var resultsSample = [
        {
            "personId": "02b23058-839c-40a4-958b-fb165269d748",
            "name": "Michelle",
            "userData": "+63",
            "email": "mserubio@unionbankph.com"
        },
        {
            "personId": "0e1aa410-42d5-41ba-8c2d-68fc75a8f30f",
            "name": "Paolo",
            "userData": "+63",
            "email": "pjbaltao@unionbankph.com"
        },
        {
            "personId": "3d20bbc7-535b-47d8-9c4e-654cd4502920",
            "name": "Marita",
            "userData": "+63",
            "email": "maritabueno@unionbankph.com"
        },
        {
            "personId": "439cd3a4-82c8-4258-91de-f2e4a37b0759",
            "name": "Arnel",
            "userData": "+639175244265",
            "email": "agdeguzman@unionbankph.com"
        },
        {
            "personId": "4fd30425-87fc-412e-9dcc-767585938ad0",
            "name": "Dennis",
            "userData": "+63",
            "email": "ddomila@unionbankph.com"
        },
        {
            "personId": "7c2acb60-b9b8-48ed-860d-ccdd908c5034",
            "name": "Henry",
            "userData": "+632",
            "email": "hrraguda@unionbankph.com"
        },
        {
            "personId": "85d3e894-6c49-466c-a6a5-a33930b73e1b",
            "name": "Robin",
            "userData": "+639262636381",
            "email": "ragdeclaro@unionbankph.com"
        },
        {
            "personId": "c3238629-1953-4431-8679-84663feab695",
            "name": "Edwin",
            "userData": "+63",
            "email": "edwinb@unionbankph.com"
        },
        {
            "personId": "cac06181-5a66-494c-8f23-c9ec1f3b04f0",
            "name": "Ana",
            "userData": "+63",
            "email": "aadelgado@unionbankph.com"
        },
        {
            "personId": "d32eb198-1152-4652-99d0-b398c5c76a78",
            "name": "Eugene",
            "userData": "+632",
            "email": "esacevedo@unionbankph.com"
        },
        {
            "personId": "d93eddd3-9070-4fbb-9c51-ecaaf7f3c1fa",
            "name": "Mafel",
            "userData": "+639277265958",
            "email": "mjmvergara@unionbankph.com"
        },
        {
            "personId": "d9a44085-ccb3-4dc2-a5bf-520cb3f24bea",
            "name": "Bobby",
            "userData": "+63",
            "email": "jrsreyes@unionbankph.com"
        },
        {
            "personId": "ef6f1fea-5ab1-4d93-b6d7-f311aa31ecf2",
            "name": "John",
            "userData": "+63",
            "email": "jclong@unionbankph.com"
        },
        {
            "personId": "fd77296f-8e19-4482-8808-5f7522961e8a",
            "name": "JAO",
            "userData": "+63",
            "email": "jaortiz@unionbankph.com"
        },
        {
            "personId": "ff6d0756-7d7f-4689-9bfd-ee40ea10fe8f",
            "name": "Dominic",
            "userData": "+639228246177",
            "email": "dominic.tuazon@gmail.com"
        }
    ];

    for(i in resultsSample) {
        if(persistentFaceId == resultsSample[i].personId) {
            var name = resultsSample[i].name;
            var email = resultsSample[i].email;

            sayName('hi ' + name);
            sendEmail(email);
            // show ad based on demographic
            var sum = averageAge.reduce(function(a, b) { return a + b; });
            var avg = sum / averageAge.length;
            var gender = mode(genderArr);
            console.log("The sum is: " + sum + ". The average is: " + avg + "; Gender is: " + gender);
        }
    }
}

function mode(arr){
    return arr.sort(function(a,b) {
          arr.filter(function(v) { v===a }).length
        - arr.filter(function(v) { v===b }).length
    }).pop();
}


// var sayOnce = true;
var sayName = function(stringText) {
    // if(sayOnce) {
        $.get('/handle_speech/'+stringText, function(data) {
            // console.log('said it yo!')
            // console.log(data);
            // sayOnce = false;
        });
    // }
}

var sendEmail = function(stringText) {
    $.get('/send_email/' + stringText, function(data) {
        console.log('Email Sent');
        console.log(data);
    })
}

var drawFaceRectangle = function(data) {
    // console.log(data);

    var frect = data[0].faceRectangle;

    resultsContext.beginPath();
    resultsContext.rect(frect.left, frect.top, frect.width, frect.height );
    resultsContext.stroke();

    // input results text
    // $('#age').html(parseInt(data[0].faceAttributes.age))
    // $('#gender').html(data[0].faceAttributes.gender)
    // if(data[0].faceAttributes.glasses != 'NoGlasses') {
    //     $('#glasses').html('| Wearing ' + data[0].faceAttributes.glasses)
    // } else {
    //     $('#glasses').html('');
    // }
    // if(data[0].faceAttributes.smile > .5)
    //     $('#smile').html('| Smiling')
    //
    // $('.info-footer').show("slow");
    //
    // for (var i = 0; i < 2; i++) {
    //     randomColor = (function(m,s,c){return (c ? arguments.callee(m,s,c-1) : '#') + s[m.floor(m.random() * s.length)]})(Math,'0123456789ABCDEF',5)
    //     setTimeout(function() {
    //         $('<div class="offer-panel" style="background-color: '+randomColor+'">Test Offer</div>').hide()
    //                 .prependTo('#results-panel').show('slow');
    //
    //     }, 800 * i)
    // }

}

var handleProgressBar = {

    setWidth: function(width) {
        if (width == 0) {
            console.log('is 0');
            $('.progress-bar-custom').css('width', 0);
        } else {
            $('.progress-bar-custom').css('width', (width*100) + '%');
        }
    }

}
