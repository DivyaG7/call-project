const socket = io();

let localStream;
let remoteStream;
let peerConnection;

const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startCallBtn = document.getElementById("startCall");
const endCallBtn = document.getElementById("endCall");

startCallBtn.onclick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("ice-candidate", event.candidate);
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer);
};

socket.on("offer", async (offer) => {
    peerConnection = new RTCPeerConnection(servers);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = event => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("ice-candidate", event.candidate);
        }
    };

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
});

socket.on("answer", async (answer) => {
    await peerConnection.setRemoteDescription(answer);
});

socket.on("ice-candidate", async (candidate) => {
    await peerConnection.addIceCandidate(candidate);
});

endCallBtn.onclick = () => {
    localStream.getTracks().forEach(track => track.stop());
    peerConnection.close();
};
