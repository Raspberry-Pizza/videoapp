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
    console.log('Remote stream added.');
    remoteStream = event.streams[0];
    remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
    remoteVideo.srcObject = null;
    localVideo.srcObject = null;
}

function sendICEcandidate(data) {
    //send only if we have caller, else no need to
    console.log("Send ICE candidate");
    callSocket.send(JSON.stringify({
        type: 'ICEcandidate',
        data
    }));

}

function handleIceCandidate(event) {
    // console.log('icecandidate event: ', event);
    if (event.candidate) {
        console.log("Local ICE candidate");
        // console.log(event.candidate.candidate);

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
        console.log('Created RTCPeerConnnection');
        return;
    } catch (e) {
        console.log('Failed to create PeerConnection, exception: ' + e.message);
        alert('Cannot create RTCPeerConnection object.');
        return;
    }
}

function createConnectionAndAddStream() {
    createPeerConnection();
    peerConnection.addStream(localStream);
    return true;
   
}

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
    //to answer a call
    callSocket.send(JSON.stringify({
        type: 'answer_call',
        data
    }));
    callProgress(true);
}

function processAccept() {

    peerConnection.setRemoteDescription(new RTCSessionDescription(remoteRTCMessage));
    peerConnection.createAnswer((sessionDescription) => {
        peerConnection.setLocalDescription(sessionDescription);

        if (iceCandidatesFromCaller.length > 0) {
            for (let i = 0; i < iceCandidatesFromCaller.length; i++) {
                //
                let candidate = iceCandidatesFromCaller[i];
                console.log("ICE candidate Added From queue");
                try {
                    peerConnection.addIceCandidate(candidate).then(done => {
                        console.log(done);
                    }).catch(error => {
                        console.log(error);
                    })
                } catch (error) {
                    console.log(error);
                }
            }
            iceCandidatesFromCaller = [];
            console.log("ICE candidate queue cleared");
        } else {
            console.log("NO Ice candidate in queue");
        }

        answerCall({
            caller: otherUser,
            rtcMessage: sessionDescription
        });

    }, (error) => {
        console.log("Error");
    });
}

function acceptCall() {
    beReady(localVideoAnswer, remoteVideoAnswer)
        .then(bool => {
            processAccept();  
        });
    document.getElementById('reject-end').innerHTML = 'End call'
}

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
    //to send a call
    console.log("Send Call");
    callSocket.send(JSON.stringify({
        type: 'call',
        data
    }));

    document.getElementById("callingmodal").style.display = "block";
    document.getElementById('callingdetails').outerHTML = "Calling " + data.name
    document.getElementById("callingmodal").classList.add("show");
}

function processCall(userName) {
    peerConnection.createOffer((sessionDescription) => {
        peerConnection.setLocalDescription(sessionDescription);
        sendCall({
            name: userName,
            rtcMessage: sessionDescription
        });
    }, (error) => {
        console.log("Error");
    });
}

const onNewCall = (data) =>{
        //when other called you
        //show answer button

        otherUser = data.caller;
        remoteRTCMessage = data.rtcMessage;

        console.log('I am receiving call from %s', data.caller);
        
        document.getElementById("receivingmodal").style.display = "block";
        document.getElementById('receivingdetails').outerHTML = data.caller + " is Calling You";
        document.getElementById("receivingmodal").classList.add("show");
}

function callProgress(status) {
    callInProgress = status;
}

const onCallAnswered = (data) =>{
        //when other accept our call
        remoteRTCMessage = data.rtcMessage;
        peerConnection.setRemoteDescription(new RTCSessionDescription(remoteRTCMessage));

        console.log("Call Started. They Answered");
        document.getElementById("callingmodal").classList.add("hide");
        // console.log(pc);

        callProgress(true);
}


const onICECandidate = (data) =>{
        // console.log(data);
        console.log("GOT ICE candidate");

        let message = data.rtcMessage;

        let candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
        });

        if (peerConnection) {
            console.log("ICE candidate Added");
            peerConnection.addIceCandidate(candidate);
        } else {
            console.log("ICE candidate Pushed");
            iceCandidatesFromCaller.push(candidate);
        }
}

window.onbeforeunload = function () {
    if (callInProgress) {
        stop();
    }
};

function callFriend(userToCall) {
    console.log('callbutton clicked', userToCall);

    otherUser = userToCall;
    beReady(localVideoCall, remoteVideoCall)
    .then(bool => {
        processCall(userToCall);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('WTF');
    myName = document.getElementById('current-user').textContent;
    console.log('MY NAME: ', myName);
    callSocket.onopen = event => {
    //let's send myName to the socket
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
            // console.log(response);
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