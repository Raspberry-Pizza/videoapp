let localStream;
let peerConnection;
let otherUser;
let remoteRTCMessage;
let localVideo;
let remoteVideo;
let localVideoCall = document.getElementById('localVideoCall');
let remoteVideoCall = document.getElementById('remoteVideoCall');
let localVideoAnswer = document.getElementById('localVideoAnswer');
let remoteVideoAnswer = document.getElementById('remoteVideoAnswer');
let callInProgress = false;
let iceCandidatesFromCaller = [];
const constraints={
    'video': true,
    'audio': false, 
};
var callSocket = new WebSocket(
        'ws://'
        + window.location.host
        + '/ws/call/'
    );
let pcConfig = {
    "iceServers":
        [
            {"urls": "stun:stun.l.google.com:19302"}
        ]
};

function logOut() {
    
}

function handleRemoteStreamAdded(event) {
    remoteStream = event.streams[0];
    remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
    remoteVideo.srcObject = null;
    localVideo.srcObject = null;
}

function sendICEcandidate(data) {
    callSocket.send(JSON.stringify({
        type: 'ICEcandidate',
        data
    }));
}

function handleIceCandidate(event) {
    if (event.candidate) {
        sendICEcandidate({
            user: otherUser,
            rtcMessage: {
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            }
        });

    } else {
        console.log('End of candidates.');
    }
}

function createPeerConnection() {
    try {
        peerConnection = new RTCPeerConnection(pcConfig);
        peerConnection.onicecandidate = handleIceCandidate;
        peerConnection.ontrack = handleRemoteStreamAdded;
        peerConnection.onremovestream = handleRemoteStreamRemoved;
        return;
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}

function createConnectionAndAddStream() {
    createPeerConnection();
    peerConnection.addStream(localStream); // Add local steam
    return true;
   
}

// Initate local stream and initiate RTC peer connection
function beReady(local, remote) {
    localVideo = local;
    remoteVideo = remote;
    return navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    })
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = stream;

            return createConnectionAndAddStream()
        })
        .catch(function (e) {
            alert('getUserMedia() error: ' + e.name);
        });
}

function answerCall(data) {
    callSocket.send(JSON.stringify({
        type: 'answer_call',
        data
    }));
    callProgress(true);
}

// accept call by sending SDP answer and ICE candidates
function processAccept() {
    peerConnection.setRemoteDescription(new RTCSessionDescription(remoteRTCMessage));
    peerConnection.createAnswer((sessionDescription) => {
        peerConnection.setLocalDescription(sessionDescription);

        if (iceCandidatesFromCaller.length > 0) {
            for (let i = 0; i < iceCandidatesFromCaller.length; i++) {
                //
                let candidate = iceCandidatesFromCaller[i];
                try {
                    peerConnection.addIceCandidate(candidate).then(done => {
                    }).catch(error => {
                        console.log('Problems adding ICE canndidates: ', error);
                    })
                } catch (error) {
                    console.log('Error adding ICE canndidates: ', error);
                }
            }
            iceCandidatesFromCaller = [];
        } else {
            console.log("NO Ice candidate in queue");
        }

        answerCall({
            caller: otherUser,
            rtcMessage: sessionDescription
        });

    }, (error) => {
        console.log("Error creating SDP answer: ", error);
    });
}

function acceptCall() {
    beReady(localVideoAnswer, remoteVideoAnswer)
        .then(bool => {
            processAccept();  
        });
    document.getElementById('reject-end').innerHTML = 'End call'
}

// closes call dialog
function closeCall(data) {
    callSocket.send(JSON.stringify({
        type: 'close_call',
        data
    }));
    callProgress(false);
}

function endCall() {
    closeCall({
        name: otherUser
    });

    localVideo.srcObject = null;
    peerConnection.close();
    document.getElementById("callingmodal").classList.remove("show");
    document.getElementById("callingmodal").style.display = "none";
}

function rejectCall() {
    closeCall({
        name: otherUser
    });
    if (localVideo) {
        localVideo.srcObject = null;
    } if (peerConnection) {
        peerConnection.close();   
    }
    document.getElementById("receivingmodal").classList.remove("show");
    document.getElementById("receivingmodal").style.display = "none";
}

function sendCall(data) {
    callSocket.send(JSON.stringify({
        type: 'call',
        data
    }));

    document.getElementById("callingmodal").style.display = "block";
    document.getElementById('callingdetails').outerHTML = "Calling " + data.name
    document.getElementById("callingmodal").classList.add("show");
}

// send SDP offer
function processCall(userName) {
    peerConnection.createOffer((sessionDescription) => {
        peerConnection.setLocalDescription(sessionDescription);
        sendCall({
            name: userName,
            rtcMessage: sessionDescription
        });
    }, (error) => {
        console.log("Error creating SDP offer: ", error);
    });
}

// receiving call
const onNewCall = (data) =>{
        otherUser = data.caller;
        remoteRTCMessage = data.rtcMessage;
        
        document.getElementById("receivingmodal").style.display = "block";
        document.getElementById('receivingdetails').outerHTML = data.caller + " is Calling You";
        document.getElementById("receivingmodal").classList.add("show");
}

function callProgress(status) {
    callInProgress = status;
}

// SDP answer received
const onCallAnswered = (data) =>{
        remoteRTCMessage = data.rtcMessage;
        peerConnection.setRemoteDescription(new RTCSessionDescription(remoteRTCMessage));

        document.getElementById("callingmodal").classList.add("hide");
        callProgress(true);
}

// Set ICE candidates
const onICECandidate = (data) =>{
        let message = data.rtcMessage;

        let candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
        });

        if (peerConnection) {
            peerConnection.addIceCandidate(candidate);
        } else {
            iceCandidatesFromCaller.push(candidate);
        }
}

window.onbeforeunload = function () {
    if (callInProgress) {
        stop();
    }
};

function callFriend(userToCall) {
    otherUser = userToCall;
    beReady(localVideoCall, remoteVideoCall)
    .then(bool => {
        processCall(userToCall);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    myName = document.getElementById('current-user').textContent;

    callSocket.onopen = event => {
        callSocket.send(JSON.stringify({
            type: 'login',
            data: {
                name: myName
            }
        }));
    }

    callSocket.onmessage = (e) => {
        let response = JSON.parse(e.data);
        let type = response.type;

        if(type == 'call_received') {
            onNewCall(response.data);
        }

        if (type == 'end_call_received') {
            if (localVideo) {
                localVideo.srcObject = null;
            } if (peerConnection) {
                peerConnection.close();   
            }
            document.getElementById("receivingmodal").classList.remove("show");
            document.getElementById("receivingmodal").style.display = "none";
            document.getElementById("callingmodal").classList.remove("show");
            document.getElementById("callingmodal").style.display = "none";
        }
        
        if(type == 'call_answered') {
            onCallAnswered(response.data);
            
        }
        if(type == 'ICEcandidate') {
            onICECandidate(response.data);
        }
    }
});