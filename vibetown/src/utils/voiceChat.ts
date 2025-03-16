import Peer, { MediaConnection } from 'peerjs';

// VoiceChat utility class handles the WebRTC voice communication
// Following single responsibility principle - only handles voice chat functionality
export class VoiceChat {
  private peer: Peer | null = null;
  private myStream: MediaStream | null = null;
  private connections: Map<string, MediaConnection> = new Map();
  private onSpeakingChangeCallback: ((isSpeaking: boolean) => void) | null = null;
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array | null = null;
  private speakingThreshold = 10; // Threshold to detect speaking
  private isSpeaking = false;
  private analyserInterval: number | null = null;
  
  // Initialize the voice chat system
  async initialize(peerId: string): Promise<void> {
    try {
      // Create a new Peer instance
      this.peer = new Peer(peerId, {
        debug: 2, // Log level
      });
      
      // Set up event handlers
      this.setupPeerEventHandlers();
      
      // Get user media (microphone)
      this.myStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      // Set up audio analysis for speaking detection
      this.setupAudioAnalysis();
      
      return new Promise((resolve) => {
        this.peer!.on('open', () => {
          console.log('PeerJS connection established with ID:', peerId);
          resolve();
        });
      });
    } catch (error) {
      console.error('Failed to initialize voice chat:', error);
      throw error;
    }
  }
  
  // Connect to another peer
  connectTo(remotePeerId: string): void {
    if (!this.peer || !this.myStream) {
      console.error('Cannot connect: Peer or stream not initialized');
      return;
    }
    
    try {
      // Call the remote peer and store the connection
      const call = this.peer.call(remotePeerId, this.myStream);
      this.handleNewConnection(call);
    } catch (error) {
      console.error('Error connecting to peer:', error);
    }
  }
  
  // Disconnect from a specific peer
  disconnectFrom(remotePeerId: string): void {
    const connection = this.connections.get(remotePeerId);
    if (connection) {
      connection.close();
      this.connections.delete(remotePeerId);
    }
  }
  
  // Disconnect from all peers and clean up
  disconnect(): void {
    // Close all connections
    this.connections.forEach(connection => connection.close());
    this.connections.clear();
    
    // Stop the local stream
    if (this.myStream) {
      this.myStream.getTracks().forEach(track => track.stop());
      this.myStream = null;
    }
    
    // Clear the audio analysis interval
    if (this.analyserInterval !== null) {
      window.clearInterval(this.analyserInterval);
      this.analyserInterval = null;
    }
    
    // Close the peer connection
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.audioAnalyser = null;
      this.audioDataArray = null;
    }
  }
  
  // Set a callback for speaking status changes
  onSpeakingChange(callback: (isSpeaking: boolean) => void): void {
    this.onSpeakingChangeCallback = callback;
  }
  
  // Set up event handlers for the peer connection
  private setupPeerEventHandlers(): void {
    if (!this.peer) return;
    
    // Handle incoming calls
    this.peer.on('call', (call) => {
      if (this.myStream) {
        call.answer(this.myStream);
        this.handleNewConnection(call);
      }
    });
    
    // Handle errors
    this.peer.on('error', (error) => {
      console.error('PeerJS error:', error);
    });
  }
  
  // Handle a new connection (incoming or outgoing)
  private handleNewConnection(call: MediaConnection): void {
    // Store the connection
    this.connections.set(call.peer, call);
    
    // Handle the remote stream
    call.on('stream', (remoteStream) => {
      // Create an audio element to play the remote stream
      const audio = document.createElement('audio');
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.id = `audio-${call.peer}`;
      document.body.appendChild(audio);
    });
    
    // Handle connection closing
    call.on('close', () => {
      this.connections.delete(call.peer);
      const audioElement = document.getElementById(`audio-${call.peer}`);
      if (audioElement) {
        audioElement.remove();
      }
    });
  }
  
  // Set up audio analysis for speaking detection
  private setupAudioAnalysis(): void {
    if (!this.myStream) return;
    
    try {
      // Create audio context and analyser
      this.audioContext = new AudioContext();
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      
      // Create a source from the stream
      const source = this.audioContext.createMediaStreamSource(this.myStream);
      source.connect(this.audioAnalyser);
      
      // Create data array for analysis
      this.audioDataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
      
      // Set up interval to check if speaking
      this.analyserInterval = window.setInterval(() => {
        this.checkIfSpeaking();
      }, 100);
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
    }
  }
  
  // Check if the user is speaking
  private checkIfSpeaking(): void {
    if (!this.audioAnalyser || !this.audioDataArray) return;
    
    // Get audio data
    this.audioAnalyser.getByteFrequencyData(this.audioDataArray);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < this.audioDataArray.length; i++) {
      sum += this.audioDataArray[i];
    }
    const average = sum / this.audioDataArray.length;
    
    // Determine if speaking
    const newIsSpeaking = average > this.speakingThreshold;
    
    // If speaking status changed, call the callback
    if (newIsSpeaking !== this.isSpeaking) {
      this.isSpeaking = newIsSpeaking;
      if (this.onSpeakingChangeCallback) {
        this.onSpeakingChangeCallback(this.isSpeaking);
      }
    }
  }
}

// Export a singleton instance
export const voiceChat = new VoiceChat();
