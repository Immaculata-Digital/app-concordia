import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Box,
    IconButton,
    Typography,
    Tooltip,
    useMediaQuery,
    Dialog,
    AppBar,
    Toolbar,
    Fade,
} from '@mui/material';
import {
    Send,
    Close,
    DeleteSweepOutlined,
    DeleteSweep,
    Person,
    OpenInFull,
    CloseFullscreen,
    Mic,
    Description,
    Cancel,
    Add,
    InsertDriveFile,
    PhotoLibrary,
    ArrowBackIosNew,
    ArrowForwardIos,
    Download,
    ZoomIn,
    ZoomOut
} from '@mui/icons-material';
import {
    useChat
} from '../../context/ChatContext';
import {
    Popover,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import BrainIcon from '../BrainIcon';
import AudioPlayer from '../AudioPlayer';
import './style.css';

interface Attachment {
    id: string;
    type: 'image' | 'file' | 'audio';
    url: string;
    name: string;
    size?: string;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: number;
    attachments?: Attachment[];
}

const Chat: React.FC = () => {
    const { isChatOpen, closeChat, isMaximized, toggleMaximized } = useChat();
    const isMobile = useMediaQuery('(max-width: 1200px)');

    const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
    const [zoomScale, setZoomScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const [messages, setMessages] = useState<Message[]>(() => {
        const saved = localStorage.getItem('erp-chat-messages');
        return saved ? JSON.parse(saved) : [
            {
                id: '1',
                text: 'Olá! Como posso ajudar você hoje?',
                sender: 'bot',
                timestamp: Date.now()
            }
        ];
    });
    const [inputValue, setInputValue] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const barsRef = useRef<(HTMLDivElement | null)[]>([]);
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const recognitionRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const inputValueRef = useRef(inputValue);
    const attachmentsRef = useRef(attachments);
    const capturedTextRef = useRef('');
    const capturedAttachmentsRef = useRef<Attachment[]>([]);
    const isPendingSendRef = useRef(false);
    const swipeStartRef = useRef(0);

    const [isClearArmed, setIsClearArmed] = useState(false);
    const clearArmedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleAttachClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleAttachClose = () => {
        setAnchorEl(null);
    };

    const handleFileTypeSelect = (type: 'image' | 'file') => {
        handleAttachClose();
        if (fileInputRef.current) {
            if (type === 'image') {
                fileInputRef.current.accept = 'image/*';
            } else {
                fileInputRef.current.accept = '*/*';
            }
            fileInputRef.current.click();
        }
    };

    const open = Boolean(anchorEl);
    const id = open ? 'attachment-popover' : undefined;

    useEffect(() => {
        localStorage.setItem('erp-chat-messages', JSON.stringify(messages));
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isMobile && isChatOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobile, isChatOpen]);

    const allImages = React.useMemo(() => {
        const images: Attachment[] = [];
        messages.forEach(msg => {
            if (msg.attachments) {
                msg.attachments.forEach(att => {
                    if (att.type === 'image') {
                        images.push(att);
                    }
                });
            }
        });
        return images;
    }, [messages]);

    const openGallery = (url: string) => {
        const index = allImages.findIndex(img => img.url === url);
        if (index !== -1) {
            setZoomScale(1);
            setPosition({ x: 0, y: 0 });
            setPreviewImageIndex(index);
        }
    };

    const handleZoomIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoomScale(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newScale = Math.max(zoomScale - 0.25, 0.5);
        if (newScale < 1) setPosition({ x: 0, y: 0 });
        setZoomScale(newScale);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({
            x: touch.clientX - position.x,
            y: touch.clientY - position.y
        });
        swipeStartRef.current = touch.clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        const newX = touch.clientX - dragStart.x;
        const newY = touch.clientY - dragStart.y;
        setPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        setIsDragging(false);
        if (zoomScale <= 1) {
            const touch = e.changedTouches[0];
            const diff = touch.clientX - swipeStartRef.current;
            if (Math.abs(diff) > 50) {
                if (diff > 0) prevImage();
                else nextImage();
            }
        }
    };

    const nextImage = (e?: React.MouseEvent | React.TouchEvent) => {
        e?.stopPropagation();
        if (previewImageIndex !== null && allImages.length > 1) {
            setZoomScale(1);
            setPosition({ x: 0, y: 0 });
            setPreviewImageIndex((previewImageIndex + 1) % allImages.length);
        }
    };

    const prevImage = (e?: React.MouseEvent | React.TouchEvent) => {
        e?.stopPropagation();
        if (previewImageIndex !== null && allImages.length > 1) {
            setZoomScale(1);
            setPosition({ x: 0, y: 0 });
            setPreviewImageIndex((previewImageIndex - 1 + allImages.length) % allImages.length);
        }
    };

    const handleDownload = (e: React.MouseEvent, url: string, name: string) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (previewImageIndex === null) return;
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'Escape') setPreviewImageIndex(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewImageIndex, allImages]);

    useEffect(() => {
        inputValueRef.current = inputValue;
    }, [inputValue]);

    useEffect(() => {
        attachmentsRef.current = attachments;
    }, [attachments]);

    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const newHeight = Math.min(textarea.scrollHeight, 154);
            textarea.style.height = `${newHeight}px`;
        }
    }, []);

    useEffect(() => {
        adjustHeight();

        // Compensate for the 0.3s transition in CSS
        const timer = setTimeout(adjustHeight, 310);
        return () => clearTimeout(timer);
    }, [inputValue, isMaximized, adjustHeight]);

    useEffect(() => {
        if (isRecording && analyserRef.current) {
            const updateLevel = () => {
                if (!analyserRef.current) return;
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);

                const values = Array.from(dataArray);
                const average = values.reduce((a, b) => a + b, 0) / values.length;
                const level = Math.min(1, average / 100);

                // Update bars directly via Ref to avoid React re-renders and lag
                barsRef.current.forEach((bar) => {
                    if (bar) {
                        const individualLevel = 4 + (level * 24 * (0.5 + Math.random()));
                        bar.style.height = `${individualLevel}px`;
                        bar.style.opacity = `${0.8 + (level * 0.2)}`;
                    }
                });

                animationFrameRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isRecording]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const executeSendMessage = (text: string, currentAttachments: Attachment[]) => {
        if (!text.trim() && currentAttachments.length === 0) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: text,
            sender: 'user',
            timestamp: Date.now(),
            attachments: currentAttachments.length > 0 ? [...currentAttachments] : undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setAttachments([]);
        setIsTyping(true);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        // Simulate bot response
        setTimeout(() => {
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: `Eu ainda estou em fase de desenvolvimento, em breve vou poder te ajudar. Você disse: "${text}"`,
                sender: 'bot',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        }, 1000);
    };

    const handleSend = () => {
        const textToSend = inputValue;
        const attachmentsToSend = [...attachments];

        if (isRecording) {
            isPendingSendRef.current = true;
            capturedTextRef.current = textToSend;
            capturedAttachmentsRef.current = attachmentsToSend;

            // Clear UI immediately for better UX
            setInputValue('');
            setAttachments([]);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }

            toggleRecording(); // This will trigger executeSendMessage after blob is ready
            return;
        }

        executeSendMessage(textToSend, attachmentsToSend);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        if (!isClearArmed) {
            setIsClearArmed(true);
            if (clearArmedTimeoutRef.current) clearTimeout(clearArmedTimeoutRef.current);
            clearArmedTimeoutRef.current = setTimeout(() => {
                setIsClearArmed(false);
            }, 3000);
            return;
        }

        if (clearArmedTimeoutRef.current) clearTimeout(clearArmedTimeoutRef.current);
        setIsClearArmed(false);

        const initialMessage: Message = {
            id: Date.now().toString(),
            text: 'Olá! Como posso ajudar você hoje?',
            sender: 'bot',
            timestamp: Date.now()
        };
        setMessages([initialMessage]);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        processFiles(Array.from(files));
    };

    const processFiles = (files: File[]) => {
        files.forEach(file => {
            const isImage = file.type.startsWith('image/');
            const reader = new FileReader();
            reader.onload = (event) => {
                const newAttachment: Attachment = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: isImage ? 'image' : 'file',
                    url: event.target?.result as string,
                    name: file.name,
                    size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
                };
                setAttachments(prev => [...prev, newAttachment]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        const pastedFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file) pastedFiles.push(file);
            }
        }
        if (pastedFiles.length > 0) {
            processFiles(pastedFiles);
        }
    };

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            if (recognitionRef.current) recognitionRef.current.stop();
            if (clearArmedTimeoutRef.current) clearTimeout(clearArmedTimeoutRef.current);
        };
    }, []);

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            if (recognitionRef.current) {
                recognitionRef.current.onresult = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onend = null;
                recognitionRef.current.abort();
                recognitionRef.current = null;
            }
            setIsRecording(false);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                // Audio Visualization Setup
                const audioContext = new AudioContext();
                audioContextRef.current = audioContext;
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                analyserRef.current = analyser;

                await audioContext.resume();

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result as string;
                        const newAttachment: Attachment = {
                            id: Math.random().toString(36).substr(2, 9),
                            type: 'audio',
                            url: base64data,
                            name: `Áudio ${new Date().toLocaleTimeString()}`,
                            size: (audioBlob.size / 1024).toFixed(1) + ' KB'
                        };

                        if (isPendingSendRef.current) {
                            executeSendMessage(capturedTextRef.current, [...capturedAttachmentsRef.current, newAttachment]);
                            isPendingSendRef.current = false;
                            capturedTextRef.current = '';
                            capturedAttachmentsRef.current = [];
                        } else {
                            setAttachments(prev => [...prev, newAttachment]);
                        }
                    };
                    reader.readAsDataURL(audioBlob);
                    audioChunksRef.current = [];
                };

                mediaRecorder.start();
                setIsRecording(true);

                // Speech Recognition Setup
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (SpeechRecognition) {
                    const recognition = new SpeechRecognition();
                    recognition.lang = 'pt-BR';
                    recognition.continuous = true;
                    recognition.interimResults = true;

                    recognition.onresult = (event: any) => {
                        if (isPendingSendRef.current) return;
                        let transcript = '';
                        for (let i = event.resultIndex; i < event.results.length; i++) {
                            transcript += event.results[i][0].transcript;
                        }
                        if (transcript) {
                            setInputValue(transcript);
                        }
                    };

                    recognition.start();
                    recognitionRef.current = recognition;
                }
            } catch (err) {
                console.error("Erro ao acessar microfone:", err);
                alert("Não foi possível acessar o microfone. Verifique as permissões.");
            }
        }
    };

    if (!isChatOpen) return null;

    const renderChat = () => (
        <Box className={`chat-container ${isMaximized ? 'maximized' : ''}`}>
            {/* Gallery Modal */}
            <Dialog
                fullScreen
                open={previewImageIndex !== null}
                onClose={() => setPreviewImageIndex(null)}
                onClick={() => setPreviewImageIndex(null)}
                TransitionComponent={Fade}
                TransitionProps={{ timeout: 500 }}
                disableEnforceFocus // Important for mobile focus handling
                className="gallery-modal"
                PaperProps={{
                    className: 'gallery-modal__paper'
                }}
            >
                {previewImageIndex !== null && allImages[previewImageIndex] && (
                    <>
                        <AppBar
                            className="gallery-appbar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Toolbar>
                                <IconButton
                                    edge="start"
                                    color="inherit"
                                    onClick={() => setPreviewImageIndex(null)}
                                    aria-label="close"
                                >
                                    <Close />
                                </IconButton>
                                <Typography className="gallery-title" variant="subtitle1" component="div">
                                    {allImages[previewImageIndex].name}
                                </Typography>

                                <Box className="gallery-zoom-controls">
                                    <IconButton color="inherit" onClick={handleZoomOut} title="Diminuir Zoom">
                                        <ZoomOut />
                                    </IconButton>
                                    <Typography className="gallery-zoom-text">
                                        {Math.round(zoomScale * 100)}%
                                    </Typography>
                                    <IconButton color="inherit" onClick={handleZoomIn} title="Aumentar Zoom">
                                        <ZoomIn />
                                    </IconButton>
                                </Box>

                                <IconButton
                                    color="inherit"
                                    onClick={(e) => handleDownload(e, allImages[previewImageIndex!].url, allImages[previewImageIndex!].name)}
                                >
                                    <Download />
                                </IconButton>
                            </Toolbar>
                        </AppBar>

                        <Box
                            className="gallery-container"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {allImages.length > 1 && (
                                <IconButton
                                    onClick={prevImage}
                                    className="gallery-nav-btn gallery-nav-btn--prev"
                                >
                                    <ArrowBackIosNew />
                                </IconButton>
                            )}

                            <img
                                src={allImages[previewImageIndex].url}
                                alt={allImages[previewImageIndex].name}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                style={{
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoomScale})`,
                                    transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: isDragging ? 'grabbing' : 'grab'
                                }}
                                className="gallery-image"
                            />

                            {allImages.length > 1 && (
                                <IconButton
                                    onClick={nextImage}
                                    className="gallery-nav-btn gallery-nav-btn--next"
                                >
                                    <ArrowForwardIos />
                                </IconButton>
                            )}

                            <Box
                                className="gallery-counter"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {previewImageIndex + 1} / {allImages.length}
                            </Box>
                        </Box>
                    </>
                )}
            </Dialog>

            <header className="chat-header">
                <Box className="chat-header-title-box">
                    <BrainIcon color="var(--color-primary)" />
                    <Typography variant="h6" component="h2">Brain Chat</Typography>
                </Box>
                <Box className="chat-header-actions">
                    {!isMobile && (
                        <Tooltip title={isMaximized ? "Reduzir" : "Maximizar"}>
                            <IconButton onClick={toggleMaximized} size="small">
                                {isMaximized ? <CloseFullscreen fontSize="small" /> : <OpenInFull fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title={isClearArmed ? "Clique novamente para confirmar" : "Limpar conversa"}>
                        <IconButton
                            onClick={clearChat}
                            size="small"
                            className={`chat-header-btn ${isClearArmed ? 'chat-header-btn--armed' : ''}`}
                        >
                            {isClearArmed ? <DeleteSweep fontSize="small" /> : <DeleteSweepOutlined fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                    <IconButton onClick={closeChat} size="small">
                        <Close fontSize="small" />
                    </IconButton>
                </Box>
            </header>

            <div className="chat-messages">
                <div className="chat-messages-inner">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`chat-message ${msg.sender}`}>
                            <div className={`message-avatar ${msg.sender}`}>
                                {msg.sender === 'user' ? <Person fontSize="small" /> : <BrainIcon size={18} color="#ffffff" />}
                            </div>
                            <div className="message-content-wrapper">
                                <div className="message-content">
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="message-attachments">
                                            {msg.attachments.map(att => (
                                                <div key={att.id} className={`attachment-item ${att.type}`}>
                                                    {att.type === 'image' ? (
                                                        <img
                                                            src={att.url}
                                                            alt={att.name}
                                                            className="attachment-image"
                                                            onClick={() => openGallery(att.url)}
                                                        />
                                                    ) : att.type === 'audio' ? (
                                                        <AudioPlayer src={att.url} />
                                                    ) : (
                                                        <div className="attachment-file">
                                                            <Description fontSize="small" />
                                                            <span className="file-name">{att.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {msg.text && <div className="text-content">{msg.text}</div>}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="chat-message bot">
                            <div className="message-avatar bot">
                                <BrainIcon size={18} color="#ffffff" />
                            </div>
                            <div className="message-content">
                                Digite...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="chat-input-area">
                {attachments.length > 0 && (
                    <div className="input-attachments-preview">
                        {attachments.map(att => (
                            <div key={att.id} className="preview-item">
                                {att.type === 'image' ? (
                                    <img src={att.url} alt="preview" />
                                ) : att.type === 'audio' ? (
                                    <div className="file-preview audio">
                                        <Mic fontSize="small" color="primary" />
                                        <span>Áudio</span>
                                    </div>
                                ) : (
                                    <div className="file-preview">
                                        <Description fontSize="small" />
                                        <span>{att.name}</span>
                                    </div>
                                )}
                                <button className="remove-att" onClick={() => removeAttachment(att.id)}>
                                    <Cancel fontSize="inherit" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="chat-input-wrapper">
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        multiple
                        onChange={handleFileUpload}
                    />
                    <IconButton
                        size="small"
                        onClick={handleAttachClick}
                        className="input-action-btn"
                    >
                        <Add fontSize="small" />
                    </IconButton>

                    <Popover
                        id={id}
                        open={open}
                        anchorEl={anchorEl}
                        onClose={handleAttachClose}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                        transformOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                        className="chat-popover"
                        PaperProps={{
                            className: 'chat-popover__paper'
                        }}
                    >
                        <List className="chat-popover__list">
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => handleFileTypeSelect('image')} className="chat-popover__button">
                                    <ListItemIcon className="chat-popover__icon chat-popover__icon--image">
                                        <PhotoLibrary fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Fotos" primaryTypographyProps={{ fontSize: '0.85rem' }} />
                                </ListItemButton>
                            </ListItem>
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => handleFileTypeSelect('file')} className="chat-popover__button">
                                    <ListItemIcon className="chat-popover__icon chat-popover__icon--file">
                                        <InsertDriveFile fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary="Arquivos" primaryTypographyProps={{ fontSize: '0.85rem' }} />
                                </ListItemButton>
                            </ListItem>
                        </List>
                    </Popover>
                    <textarea
                        ref={textareaRef}
                        className="chat-input"
                        placeholder={isRecording ? "Gravando áudio..." : "Digite sua mensagem..."}
                        rows={1}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onPaste={handlePaste}
                        readOnly={isRecording}
                    />
                    {isRecording && (
                        <div className="audio-level-container">
                            {[...Array(12)].map((_, i) => (
                                <div
                                    key={i}
                                    ref={el => { barsRef.current[i] = el }}
                                    className="audio-bar"
                                    style={{ height: '4px', opacity: 0.8 }}
                                />
                            ))}
                        </div>
                    )}
                    {inputValue.trim() || attachments.length > 0 ? (
                        <IconButton
                            size="small"
                            className="send-button"
                            onClick={handleSend}
                        >
                            <Send fontSize="inherit" />
                        </IconButton>
                    ) : (
                        <IconButton
                            size="small"
                            onClick={toggleRecording}
                            className={`input-action-btn ${isRecording ? 'recording' : ''}`}
                        >
                            {isRecording ? <Send fontSize="small" /> : <Mic fontSize="small" />}
                        </IconButton>
                    )}
                </div>
                {isRecording && (
                    <Typography variant="caption" color="error" className="chat-recording-message">
                        Gravando áudio... Clique no microfone para parar.
                    </Typography>
                )}
            </div>
        </Box>
    );

    const chatContent = renderChat();

    if (isMobile) {
        return createPortal(chatContent, document.body);
    }

    return chatContent;
};

export default Chat;
