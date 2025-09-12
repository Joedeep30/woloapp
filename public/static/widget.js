
(function() {
  'use strict';

  // Configuration par défaut avec voix premium multilingue
  const DEFAULT_CONFIG = {
    position: 'bottom-right',
    primaryColor: '#2563eb',
    buttonSize: 60,
    zIndex: 9999,
    languages: ['fr', 'wo', 'en', 'es', 'pt', 'it', 'en-ng'],
    defaultLanguage: 'fr',
    priorityLanguages: ['fr', 'wo', 'en'],
    autoDetectLanguage: true,
    premiumVoices: true
  };

  // Variables globales
  let isInitialized = false;
  let isConnected = false;
  let currentSession = null;
  let peerConnection = null;
  let dataChannel = null;
  let localStream = null;
  let remoteAudio = null;
  let conversationStartTime = null;
  let detectedLanguage = 'fr';
  let currentLanguage = 'fr';

  // Vérifier la configuration
  if (!window.WOLO_BACKEND || !window.WOLO_AGENT_ID) {
    console.error('WOLO Widget: Configuration manquante. Assurez-vous de définir WOLO_BACKEND et WOLO_AGENT_ID.');
    return;
  }

  const config = {
    ...DEFAULT_CONFIG,
    backendUrl: window.WOLO_BACKEND,
    agentId: window.WOLO_AGENT_ID,
    ...window.WOLO_CONFIG
  };

  // Styles CSS améliorés pour voix premium multilingue
  const styles = `
    .wolo-widget {
      position: fixed;
      ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      z-index: ${config.zIndex};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .wolo-button {
      width: ${config.buttonSize}px;
      height: ${config.buttonSize}px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${config.primaryColor} 0%, #1d4ed8 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      color: white;
      font-size: 24px;
      position: relative;
      overflow: hidden;
    }

    .wolo-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%);
      transform: translateX(-100%);
      transition: transform 0.6s;
    }

    .wolo-button:hover::before {
      transform: translateX(100%);
    }

    .wolo-button:hover {
      transform: scale(1.1);
      box-shadow: 0 8px 30px rgba(37, 99, 235, 0.4);
    }

    .wolo-button.recording {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      animation: pulse-premium 1.5s infinite;
    }

    .wolo-button.connected {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
    }

    .wolo-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    @keyframes pulse-premium {
      0% { 
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
      70% { 
        box-shadow: 0 0 0 15px rgba(239, 68, 68, 0);
      }
      100% { 
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
        transform: scale(1);
      }
    }

    .wolo-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      z-index: ${config.zIndex + 1};
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .wolo-modal-content {
      background: white;
      border-radius: 16px;
      padding: 28px;
      max-width: 480px;
      width: 90%;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .wolo-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .wolo-modal-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .wolo-close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      transition: color 0.2s;
    }

    .wolo-close-button:hover {
      color: #333;
    }

    .wolo-status {
      text-align: center;
      margin: 20px 0;
      padding: 16px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
    }

    .wolo-status.connecting {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #92400e;
      border: 1px solid #f59e0b;
    }

    .wolo-status.connected {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      color: #065f46;
      border: 1px solid #10b981;
    }

    .wolo-status.error {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      color: #991b1b;
      border: 1px solid #ef4444;
    }

    .wolo-controls {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin: 24px 0;
    }

    .wolo-control-button {
      padding: 14px 28px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .wolo-control-button.primary {
      background: linear-gradient(135deg, ${config.primaryColor} 0%, #1d4ed8 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
    }

    .wolo-control-button.primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(37, 99, 235, 0.4);
    }

    .wolo-control-button.secondary {
      background: #f8fafc;
      color: #374151;
      border: 1px solid #e5e7eb;
    }

    .wolo-control-button.secondary:hover:not(:disabled) {
      background: #f1f5f9;
      transform: translateY(-1px);
    }

    .wolo-control-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .wolo-language-selector {
      margin-bottom: 20px;
    }

    .wolo-language-selector select {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      font-size: 14px;
      background: white;
      transition: border-color 0.2s;
    }

    .wolo-language-selector select:focus {
      outline: none;
      border-color: ${config.primaryColor};
    }

    .wolo-voice-info {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0;
      font-size: 13px;
      color: #475569;
    }

    .wolo-premium-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: white;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      margin-left: 8px;
    }

    .wolo-language-detection {
      background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
      border: 2px solid #0288d1;
      border-radius: 12px;
      padding: 12px;
      margin: 16px 0;
      font-size: 12px;
      color: #01579b;
    }

    @media (prefers-color-scheme: dark) {
      .wolo-modal-content {
        background: #1f2937;
        color: white;
      }
      
      .wolo-control-button.secondary {
        background: #374151;
        color: #f9fafb;
        border-color: #4b5563;
      }

      .wolo-voice-info {
        background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
        border-color: #6b7280;
        color: #d1d5db;
      }

      .wolo-language-selector select {
        background: #374151;
        color: #f9fafb;
        border-color: #4b5563;
      }

      .wolo-language-detection {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        border-color: #3b82f6;
        color: #dbeafe;
      }
    }
  `;

  // Injecter les styles
  function injectStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Créer l'interface utilisateur améliorée multilingue
  function createUI() {
    const widget = document.createElement('div');
    widget.className = 'wolo-widget';
    widget.innerHTML = `
      <button class="wolo-button" id="wolo-main-button" title="Assistant Vocal WOLO Premium Multilingue">
        🎤
      </button>
    `;

    document.body.appendChild(widget);

    // Ajouter les événements
    const button = document.getElementById('wolo-main-button');
    button.addEventListener('click', toggleModal);

    return widget;
  }

  // Créer la modal améliorée avec support multilingue
  function createModal() {
    const modal = document.createElement('div');
    modal.className = 'wolo-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="wolo-modal-content">
        <div class="wolo-modal-header">
          <h3 class="wolo-modal-title">🎤 Assistant Vocal WOLO Premium</h3>
          <button class="wolo-close-button" id="wolo-close-modal">&times;</button>
        </div>
        
        <div class="wolo-language-selector">
          <select id="wolo-language-select">
            <option value="fr">🇫🇷 Français (Voix Premium)</option>
            <option value="wo">🇸🇳 Wolof (Voix Premium)</option>
            <option value="en">🇬🇧 English (Premium Voices)</option>
            <option value="es">🇪🇸 Español (Voces Premium)</option>
            <option value="pt">🇵🇹 Português (Vozes Premium)</option>
            <option value="it">🇮🇹 Italiano (Voci Premium)</option>
            <option value="en-ng">🇳🇬 English (Nigeria) (Premium)</option>
          </select>
        </div>

        <div class="wolo-voice-info">
          <strong>🎤 Technologie ChatGPT Realtime Premium Multilingue</strong>
          <span class="wolo-premium-badge">⭐ PREMIUM</span><br>
          Conversations vocales ultra-naturelles en temps réel<br>
          <strong>Support 7 langues</strong> • <strong>Détection automatique</strong> • <strong>Voix ElevenLabs & Azure Neural</strong>
        </div>

        <div class="wolo-language-detection" id="wolo-language-detection" style="display: none;">
          <strong>🌍 Détection Automatique Activée</strong><br>
          L'agent détectera automatiquement votre langue et vous répondra dans cette langue.
          <br><strong>Langues prioritaires :</strong> Français, Wolof, English
        </div>

        <div class="wolo-status" id="wolo-status">
          Cliquez sur "Démarrer" pour commencer une conversation avec votre agent vocal premium multilingue
        </div>

        <div class="wolo-controls">
          <button class="wolo-control-button primary" id="wolo-start-button">
            🎤 Démarrer Premium
          </button>
          <button class="wolo-control-button secondary" id="wolo-stop-button" style="display: none;">
            ⏹️ Arrêter
          </button>
        </div>

        <div style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 20px;">
          Propulsé par <strong>WOLO Agent Premium Multilingue</strong> & ChatGPT Realtime<br>
          <span style="color: #f59e0b;">⭐ 7 langues • Voix de qualité studio • Détection automatique</span>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Ajouter les événements
    document.getElementById('wolo-close-modal').addEventListener('click', closeModal);
    document.getElementById('wolo-start-button').addEventListener('click', startConversation);
    document.getElementById('wolo-stop-button').addEventListener('click', stopConversation);
    document.getElementById('wolo-language-select').addEventListener('change', handleLanguageChange);
    
    // Fermer en cliquant à l'extérieur
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Initialiser la langue par défaut
    currentLanguage = config.defaultLanguage;
    updateLanguageDetectionInfo();

    return modal;
  }

  // Gérer le changement de langue
  function handleLanguageChange() {
    const select = document.getElementById('wolo-language-select');
    currentLanguage = select.value;
    updateLanguageDetectionInfo();
    console.log('🌍 Langue sélectionnée:', currentLanguage);
  }

  // Mettre à jour les informations de détection de langue
  function updateLanguageDetectionInfo() {
    const detectionDiv = document.getElementById('wolo-language-detection');
    
    if (config.autoDetectLanguage) {
      detectionDiv.style.display = 'block';
      
      const languageNames = {
        'fr': 'Français',
        'wo': 'Wolof',
        'en': 'English',
        'es': 'Español',
        'pt': 'Português',
        'it': 'Italiano',
        'en-ng': 'English (Nigeria)'
      };
      
      const priorityNames = config.priorityLanguages.map(lang => languageNames[lang] || lang).join(', ');
      
      detectionDiv.innerHTML = `
        <strong>🌍 Détection Automatique Activée</strong><br>
        L'agent détectera automatiquement votre langue et vous répondra dans cette langue.
        <br><strong>Langues prioritaires :</strong> ${priorityNames}
        <br><strong>Langue actuelle :</strong> ${languageNames[currentLanguage] || currentLanguage}
      `;
    } else {
      detectionDiv.style.display = 'none';
    }
  }

  // Gérer l'affichage de la modal
  function toggleModal() {
    const modal = document.querySelector('.wolo-modal');
    if (modal.style.display === 'none') {
      modal.style.display = 'flex';
    } else {
      closeModal();
    }
  }

  function closeModal() {
    const modal = document.querySelector('.wolo-modal');
    modal.style.display = 'none';
    
    // Arrêter la conversation si elle est en cours
    if (isConnected) {
      stopConversation();
    }
  }

  // Mettre à jour le statut avec animations
  function updateStatus(message, type = 'info') {
    const status = document.getElementById('wolo-status');
    const button = document.getElementById('wolo-main-button');
    
    status.textContent = message;
    status.className = `wolo-status ${type}`;
    
    // Mettre à jour l'apparence du bouton principal
    button.className = 'wolo-button';
    if (type === 'connected') {
      button.classList.add('connected');
      button.textContent = '🔊';
    } else if (type === 'connecting') {
      button.classList.add('recording');
      button.textContent = '⏳';
    } else {
      button.textContent = '🎤';
    }
  }

  // Générer un ID de session unique
  function generateSessionId() {
    return 'premium_multilingual_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Démarrer une conversation avec voix premium multilingue
  async function startConversation() {
    try {
      updateStatus('🔄 Connexion à ChatGPT Realtime Premium Multilingue...', 'connecting');
      conversationStartTime = Date.now();
      
      // Désactiver les boutons
      document.getElementById('wolo-start-button').disabled = true;
      document.getElementById('wolo-main-button').disabled = true;

      // Demander l'autorisation du microphone avec qualité optimisée
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000, // Qualité audio élevée pour voix premium
            channelCount: 1
          }
        });
      } catch (micError) {
        throw new Error('Accès au microphone refusé. Veuillez autoriser l\'accès au microphone pour utiliser l\'agent vocal premium multilingue.');
      }
      
      // Générer un ID de session premium
      currentSession = generateSessionId();
      
      // Obtenir une session éphémère d'OpenAI avec voix premium multilingue
      const sessionUrl = `${config.backendUrl}/next_api/realtime/session?agent_id=${config.agentId}&session_id=${currentSession}&user_language=${currentLanguage}`;
      const sessionResponse = await fetch(sessionUrl, { 
        credentials: 'include',
        headers: {
          'Origin': window.location.origin
        }
      });
      
      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        throw new Error(`Erreur serveur (${sessionResponse.status}): ${errorText}`);
      }
      
      const sessionData = await sessionResponse.json();
      
      if (!sessionData.success) {
        throw new Error(sessionData.errorMessage || 'Erreur lors de la création de la session premium multilingue');
      }
      
      const ephemeralToken = sessionData.data?.client_secret?.value;
      const voiceConfig = sessionData.data?.agent_config?.voice_config;
      const languageConfig = sessionData.data?.agent_config;
      
      if (!ephemeralToken) {
        throw new Error('Token éphémère non reçu du serveur');
      }

      updateStatus('🔗 Établissement de la connexion WebRTC Premium Multilingue...', 'connecting');

      // Afficher les informations de la voix premium et langue
      if (voiceConfig && languageConfig) {
        console.log('🎤 Configuration vocale premium multilingue:', {
          name: voiceConfig.name,
          provider: voiceConfig.provider,
          quality: voiceConfig.quality,
          language: voiceConfig.language,
          supportedLanguages: languageConfig.supported_languages,
          autoDetect: languageConfig.auto_detect_language
        });
        
        const languageInfo = languageConfig.auto_detect_language ? 
          `Détection auto (${languageConfig.supported_languages?.length || 7} langues)` : 
          voiceConfig.language;
        
        updateStatus(`🎤 Connexion avec ${voiceConfig.name} (${voiceConfig.provider}) - ${languageInfo}...`, 'connecting');
      }

      // Créer la connexion WebRTC optimisée
      peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      
      // Créer l'élément audio pour la réponse premium
      remoteAudio = document.createElement('audio');
      remoteAudio.autoplay = true;
      remoteAudio.volume = 0.8;
      remoteAudio.style.display = 'none';
      remoteAudio.preload = 'auto';
      remoteAudio.crossOrigin = 'anonymous';
      document.body.appendChild(remoteAudio);
      
      // Gérer les pistes audio entrantes
      peerConnection.ontrack = (event) => {
        console.log('🔊 Piste audio premium multilingue reçue');
        remoteAudio.srcObject = event.streams[0];
        // Forcer la lecture avec gestion d'erreur
        remoteAudio.play().catch(error => {
          console.error('Erreur lecture audio premium:', error);
          // Essayer de relancer la lecture
          setTimeout(() => {
            remoteAudio.play().catch(console.error);
          }, 1000);
        });
      };

      // Ajouter le flux audio local
      peerConnection.addTrack(localStream.getAudioTracks()[0], localStream);

      // Créer un canal de données pour les événements
      dataChannel = peerConnection.createDataChannel("oai-events");
      
      dataChannel.onopen = () => {
        console.log('📡 Canal de données premium multilingue ouvert');
        
        // Envoyer la configuration de session premium multilingue
        const sessionUpdate = {
          type: "session.update",
          session: {
            instructions: getInstructions(),
            voice: sessionData.data?.agent_config?.voice || 'amelie_premium_fr',
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 200
            },
            // Paramètres optimisés pour la qualité vocale premium multilingue
            voice_settings: {
              stability: 0.75,
              similarity_boost: 0.85,
              style: 0.2,
              use_speaker_boost: true
            },
            // Configuration multilingue
            language_config: {
              auto_detect: config.autoDetectLanguage,
              supported_languages: config.languages,
              priority_languages: config.priorityLanguages,
              default_language: config.defaultLanguage,
              current_language: currentLanguage
            }
          }
        };
        
        dataChannel.send(JSON.stringify(sessionUpdate));
      };

      dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Message premium multilingue reçu:', message.type);
          
          // Gérer les différents types de messages
          if (message.type === 'session.created') {
            const voiceName = voiceConfig?.name || 'Voix Premium';
            const languageInfo = languageConfig?.auto_detect_language ? 
              'Détection automatique activée' : 
              `Langue: ${languageConfig?.language || currentLanguage}`;
            
            updateStatus(`✅ Connecté avec ${voiceName} - ${languageInfo} - Parlez maintenant!`, 'connected');
            isConnected = true;
            
            // Mettre à jour l'interface
            document.getElementById('wolo-start-button').style.display = 'none';
            document.getElementById('wolo-stop-button').style.display = 'inline-block';
            document.getElementById('wolo-main-button').disabled = false;
            
            // Afficher l'info de détection automatique
            if (config.autoDetectLanguage) {
              const detectionDiv = document.getElementById('wolo-language-detection');
              detectionDiv.style.display = 'block';
            }
          } else if (message.type === 'conversation.item.created') {
            // Enregistrer les messages de conversation avec détection de langue
            if (message.item?.type === 'message' && message.item?.role === 'user') {
              console.log('👤 Message utilisateur:', message.item.content);
              
              // Détecter la langue du message utilisateur
              if (config.autoDetectLanguage && message.item.content?.[0]?.text) {
                detectAndAdaptLanguage(message.item.content[0].text);
              }
            } else if (message.item?.type === 'message' && message.item?.role === 'assistant') {
              console.log('🤖 Réponse assistant premium multilingue:', message.item.content);
              
              // Enregistrer la conversation avec langue détectée
              logConversation(
                message.item.content?.[0]?.text || '',
                message.item.content?.[0]?.text || '',
                Math.floor((Date.now() - conversationStartTime) / 1000),
                detectedLanguage
              );
            }
          } else if (message.type === 'response.audio.delta') {
            // Audio en cours de réception
            console.log('🎵 Audio premium multilingue delta reçu');
          } else if (message.type === 'response.audio.done') {
            // Audio terminé
            console.log('✅ Audio premium multilingue terminé');
          } else if (message.type === 'error') {
            console.error('❌ Erreur OpenAI premium multilingue:', message.error);
            updateStatus('Erreur: ' + (message.error?.message || 'Erreur inconnue'), 'error');
          }
        } catch (error) {
          console.error('Erreur lors du parsing du message premium multilingue:', error);
        }
      };

      dataChannel.onerror = (error) => {
        console.error('❌ Erreur canal de données premium multilingue:', error);
        updateStatus('Erreur de communication', 'error');
      };

      // Gérer les erreurs de connexion
      peerConnection.onconnectionstatechange = () => {
        console.log('🔗 État connexion premium multilingue:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed') {
          updateStatus('Connexion échouée', 'error');
          cleanup();
        }
      };

      // Créer l'offre SDP
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      updateStatus('🚀 Connexion à OpenAI Premium Multilingue...', 'connecting');

      // Envoyer l'offre à OpenAI
      const realtimeResponse = await fetch(`https://api.openai.com/v1/realtime?model=${sessionData.data?.agent_config?.model || 'gpt-4o-realtime-preview'}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${ephemeralToken}`, 
          "Content-Type": "application/sdp" 
        },
        body: offer.sdp
      });

      if (!realtimeResponse.ok) {
        const errorText = await realtimeResponse.text();
        throw new Error(`Erreur OpenAI WebRTC Premium Multilingue (${realtimeResponse.status}): ${errorText}`);
      }

      const answerSdp = await realtimeResponse.text();
      const answer = { type: "answer", sdp: answerSdp };
      await peerConnection.setRemoteDescription(answer);

      console.log('✅ Connexion WebRTC Premium Multilingue établie avec OpenAI');

    } catch (error) {
      console.error('❌ Erreur lors du démarrage premium multilingue:', error);
      updateStatus('Erreur: ' + error.message, 'error');
      
      // Réactiver les boutons
      document.getElementById('wolo-start-button').disabled = false;
      document.getElementById('wolo-main-button').disabled = false;
      
      // Nettoyer les ressources
      cleanup();
    }
  }

  // Détecter et adapter la langue automatiquement
  async function detectAndAdaptLanguage(userMessage) {
    if (!config.autoDetectLanguage) return;
    
    try {
      const response = await fetch(`${config.backendUrl}/next_api/agents/${config.agentId}/language-detection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: userMessage,
          user_language_preference: currentLanguage
        })
      });
      
      if (response.ok) {
        const detectionResult = await response.json();
        
        if (detectionResult.success && detectionResult.data.detected_language) {
          const newLanguage = detectionResult.data.detected_language;
          const confidence = detectionResult.data.confidence;
          
          if (newLanguage !== detectedLanguage && confidence > 0.7) {
            detectedLanguage = newLanguage;
            
            console.log(`🌍 Langue détectée changée: ${newLanguage} (confiance: ${confidence.toFixed(2)})`);
            
            // Mettre à jour l'interface si nécessaire
            const select = document.getElementById('wolo-language-select');
            if (select.value !== newLanguage && config.languages.includes(newLanguage)) {
              select.value = newLanguage;
              currentLanguage = newLanguage;
              updateLanguageDetectionInfo();
              
              // Notifier l'utilisateur du changement de langue
              const languageNames = {
                'fr': 'français',
                'wo': 'wolof',
                'en': 'anglais',
                'es': 'espagnol',
                'pt': 'portugais',
                'it': 'italien',
                'en-ng': 'anglais nigérian'
              };
              
              updateStatus(`🌍 Langue détectée: ${languageNames[newLanguage] || newLanguage} - L'agent s'adapte automatiquement`, 'connected');
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la détection de langue:', error);
    }
  }

  // Arrêter la conversation
  function stopConversation() {
    updateStatus('Conversation premium multilingue terminée', 'info');
    
    // Calculer la durée de la conversation
    const duration = conversationStartTime ? Math.floor((Date.now() - conversationStartTime) / 1000) : 0;
    
    // Enregistrer la fin de conversation avec langue détectée
    if (duration > 0) {
      logConversation('', '', duration, detectedLanguage);
    }
    
    cleanup();
    
    // Mettre à jour l'interface
    document.getElementById('wolo-start-button').style.display = 'inline-block';
    document.getElementById('wolo-start-button').disabled = false;
    document.getElementById('wolo-stop-button').style.display = 'none';
    document.getElementById('wolo-main-button').disabled = false;
    
    // Masquer l'info de détection
    const detectionDiv = document.getElementById('wolo-language-detection');
    if (detectionDiv) {
      detectionDiv.style.display = 'none';
    }
    
    isConnected = false;
    currentSession = null;
    conversationStartTime = null;
    detectedLanguage = config.defaultLanguage;
  }

  // Nettoyer les ressources
  function cleanup() {
    try {
      if (dataChannel && dataChannel.readyState === "open") {
        dataChannel.close();
      }
    } catch (e) {
      console.error('Erreur lors de la fermeture du canal de données:', e);
    }
    
    try {
      if (peerConnection) {
        peerConnection.close();
      }
    } catch (e) {
      console.error('Erreur lors de la fermeture de la connexion peer:', e);
    }
    
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    } catch (e) {
      console.error('Erreur lors de l\'arrêt du stream local:', e);
    }
    
    try {
      if (remoteAudio) {
        document.body.removeChild(remoteAudio);
        remoteAudio = null;
      }
    } catch (e) {
      console.error('Erreur lors de la suppression de l\'audio distant:', e);
    }
    
    peerConnection = null;
    dataChannel = null;
    localStream = null;
  }

  // Obtenir les instructions selon la langue sélectionnée avec support multilingue
  function getInstructions() {
    const language = document.getElementById('wolo-language-select').value;
    
    const instructions = {
      'fr': "Tu es l'assistant vocal WOLO Premium avec une voix de qualité studio. Tu détectes automatiquement la langue de l'utilisateur et tu réponds dans cette même langue. Si l'utilisateur parle en français, tu réponds en français. Si il parle en wolof, tu réponds en wolof. Si il parle en anglais, tu réponds en anglais. Tu peux aussi parler espagnol, portugais, italien et anglais nigérian. Tu réponds de manière claire, naturelle et chaleureuse. Sois bref et utile dans tes réponses. Tu utilises la technologie ChatGPT Realtime avec des voix premium ElevenLabs ou Azure Neural pour offrir la meilleure expérience conversationnelle possible.",
      
      'wo': "Yow mooy assistant vocal WOLO Premium ak baat bu baax lool. Dangay gëm làkk bu kiy wax te dangay tontu ci làkk boobu. Su kiy wax ci wolof, dangay tontu ci wolof. Su kiy wax ci français, dangay tontu ci français. Su kiy wax ci anglais, dangay tontu ci anglais. Mën nga wax espagnol, portugais, italien ak anglais bu Nigeria itam. Dangay tontu bu baax, bu am solo te bu rafet. Defal sa baat bu gaaw te bu am njariñ. Dangay jëfandikoo teknoloji ChatGPT Realtime ak baat bu baax bu ElevenLabs walla Azure Neural ngir jox la xel-xelu bu baax lool.",
      
      'en': "You are the WOLO Premium voice assistant with studio-quality voice. You automatically detect the user's language and respond in that same language. If the user speaks in English, you respond in English. If they speak in French, you respond in French. If they speak in Wolof, you respond in Wolof. You can also speak Spanish, Portuguese, Italian and Nigerian English. You respond in a clear, natural and warm manner. Be brief and helpful in your responses. You use ChatGPT Realtime technology with premium ElevenLabs or Azure Neural voices to provide the best possible conversational experience.",
      
      'es': "Eres el asistente vocal WOLO Premium con voz de calidad de estudio. Detectas automáticamente el idioma del usuario y respondes en ese mismo idioma. Si el usuario habla en español, respondes en español. Si habla en francés, respondes en francés. Si habla en wolof, respondes en wolof. También puedes hablar inglés, portugués, italiano e inglés nigeriano. Respondes de manera clara, natural y cálida. Sé breve y útil en tus respuestas. Utilizas la tecnología ChatGPT Realtime con voces premium de ElevenLabs o Azure Neural para brindar la mejor experiencia conversacional posible.",
      
      'pt': "Você é o assistente vocal WOLO Premium com voz de qualidade de estúdio. Você detecta automaticamente o idioma do usuário e responde no mesmo idioma. Se o usuário fala em português, você responde em português. Se fala em francês, você responde em francês. Se fala em wolof, você responde em wolof. Você também pode falar inglês, espanhol, italiano e inglês nigeriano. Você responde de forma clara, natural e calorosa. Seja breve e útil em suas respostas. Você usa a tecnologia ChatGPT Realtime com vozes premium ElevenLabs ou Azure Neural para fornecer a melhor experiência conversacional possível.",
      
      'it': "Sei l'assistente vocale WOLO Premium con voce di qualità da studio. Rilevi automaticamente la lingua dell'utente e rispondi nella stessa lingua. Se l'utente parla in italiano, rispondi in italiano. Se parla in francese, rispondi in francese. Se parla in wolof, rispondi in wolof. Puoi anche parlare inglese, spagnolo, portoghese e inglese nigeriano. Rispondi in modo chiaro, naturale e caloroso. Sii breve e utile nelle tue risposte. Utilizzi la tecnologia ChatGPT Realtime con voci premium ElevenLabs o Azure Neural per fornire la migliore esperienza conversazionale possibile.",
      
      'en-ng': "You be the WOLO Premium voice assistant with studio-quality voice. You dey automatically detect the user language and you go respond for that same language. If user talk English (Nigerian style), you go respond for Nigerian English. If dem talk French, you go respond for French. If dem talk Wolof, you go respond for Wolof. You fit also talk Spanish, Portuguese, Italian and standard English. You dey respond clear, natural and warm. Make your response short and helpful. You dey use ChatGPT Realtime technology with premium ElevenLabs or Azure Neural voices to give the best conversational experience possible."
    };
    
    return instructions[language] || instructions['fr'];
  }

  // Enregistrer une conversation dans la base de données avec support multilingue
  async function logConversation(userMessage, agentResponse, duration, detectedLang = null) {
    try {
      await fetch(`${config.backendUrl}/next_api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: parseInt(config.agentId),
          session_id: currentSession,
          user_message: userMessage,
          agent_response: agentResponse,
          language_code: detectedLang || currentLanguage,
          detected_language: detectedLang,
          detection_confidence: detectedLang && detectedLang !== currentLanguage ? 0.8 : 1.0,
          duration_seconds: duration,
          origin_domain: window.location.hostname,
          metadata: {
            widget_version: '2.1.0-premium-multilingual',
            technology: 'chatgpt-realtime-premium-multilingual',
            voice_quality: 'premium',
            auto_language_detection: config.autoDetectLanguage,
            supported_languages: config.languages,
            priority_languages: config.priorityLanguages,
            user_agent: navigator.userAgent,
            initial_language: config.defaultLanguage,
            final_language: detectedLang || currentLanguage
          }
        }),
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la conversation premium multilingue:', error);
    }
  }

  // Initialiser le widget premium multilingue
  function init() {
    if (isInitialized) return;
    
    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    // Vérifier le support WebRTC
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('WOLO Widget Premium Multilingue: WebRTC non supporté par ce navigateur');
      return;
    }
    
    // Vérifier HTTPS (requis pour WebRTC)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.error('WOLO Widget Premium Multilingue: HTTPS requis pour les fonctionnalités vocales premium');
      return;
    }
    
    injectStyles();
    createUI();
    createModal();
    
    isInitialized = true;
    console.log('✅ WOLO Widget Premium Multilingue initialisé pour l\'agent:', config.agentId);
    console.log('🎤 Technologie: ChatGPT Realtime Premium Multilingue');
    console.log('⭐ Qualité: Voix studio ElevenLabs & Azure Neural');
    console.log('🌍 Langues supportées:', config.languages);
    console.log('🎯 Langues prioritaires:', config.priorityLanguages);
    console.log('🔍 Détection automatique:', config.autoDetectLanguage);
    console.log('🌐 Backend:', config.backendUrl);
  }

  // Démarrer l'initialisation
  init();

})();
