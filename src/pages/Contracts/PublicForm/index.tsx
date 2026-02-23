import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
    Box,
    Container,
    Paper,
    Typography,
    Button,
    Stack,
    CircularProgress,
    LinearProgress,
} from '@mui/material'
import { ArrowBack, ArrowForward, CheckCircle } from '@mui/icons-material'
import { peopleService } from '../../../services/people'
import { contractsService } from '../../../services/contracts'
import FileUpload from '../../../components/FileUpload'
import TextPicker from '../../../components/TextPicker'
import MailPicker from '../../../components/MailPicker'
import DatePicker from '../../../components/DatePicker'
import SelectPicker from '../../../components/SelectPicker'
import CEPPicker from '../../../components/CEPPicker'
import CPFCNPJPicker from '../../../components/CPFCNPJPicker'
import Toast from '../../../components/Toast'
import NotFound from '../../NotFound'
import logoConcordia from '../../../assets/images/logo.png'
import './style.css'

import { ThemeProvider } from '@mui/material/styles'
import { createAppTheme } from '../../../theme'

type FormData = {
    // CPF/CNPJ
    cpfCnpj: string

    // Dados para CPF
    nomeCompleto: string
    email: string
    dataNascimento: string
    estadoCivil: string
    nacionalidade: string
    profissao: string

    // Dados para CNPJ
    nomeFantasia: string
    representanteNome: string
    representanteCpf: string

    // Endereço (comum para ambos)
    cep: string
    endereco: string
    numero: string
    complemento: string
    bairro: string
    cidade: string
    estado: string

    // Documentos CPF (arquivos)
    rg: { file: string; fileName: string; fileSize: number | string }
    cnh: { file: string; fileName: string; fileSize: number | string }
    cin: { file: string; fileName: string; fileSize: number | string }
    cpf: { file: string; fileName: string; fileSize: number | string }
    comprovanteResidencia: { file: string; fileName: string; fileSize: number | string }
    comprovanteDadosBancarios: { file: string; fileName: string; fileSize: number | string }

    // Documentos CNPJ
    contratoSocial: { file: string; fileName: string; fileSize: number | string }
    representanteRg: { file: string; fileName: string; fileSize: number | string }
    representanteCnh: { file: string; fileName: string; fileSize: number | string }
    representanteCin: { file: string; fileName: string; fileSize: number | string }
    representanteCpfDoc: { file: string; fileName: string; fileSize: number | string }

    // Observações
    observacoes: string
}

const estadosCivis = [
    { label: 'Solteiro(a)', value: 'solteiro' },
    { label: 'Casado(a)', value: 'casado' },
    { label: 'Divorciado(a)', value: 'divorciado' },
    { label: 'Viúvo(a)', value: 'viuvo' },
    { label: 'Separado(a)', value: 'separado' },
]

const estadosBrasil = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

// Função para determinar se é CPF ou CNPJ
const isCPF = (cpfCnpj: string): boolean => {
    const clean = cpfCnpj.replace(/\D/g, '')
    return clean.length === 11
}

const ContractPublicForm = () => {
    const { contractId } = useParams<{ contractId: string }>()

    console.log('[PublicForm] Componente renderizado. ContractId:', contractId)

    // Aplicar classe theme-dark no HTML para que os estilos CSS do DatePicker funcionem
    useEffect(() => {
        const root = document.documentElement
        root.classList.add('theme-dark')
        root.style.setProperty('color-scheme', 'dark')

        return () => {
            // Não remover a classe ao desmontar, pois pode ser necessário para outras páginas
            // A classe será gerenciada pelo ThemeContext nas páginas protegidas
        }
    }, [])

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [loadingNext, setLoadingNext] = useState(false)
    const [valid, setValid] = useState(false)
    const [notFound, setNotFound] = useState(false)
    const [showThankYou, setShowThankYou] = useState(false)
    const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({
        open: false,
        message: '',
    })

    const [formData, setFormData] = useState<FormData>({
        cpfCnpj: '',
        nomeCompleto: '',
        email: '',
        dataNascimento: '',
        estadoCivil: '',
        nacionalidade: '',
        profissao: '',
        nomeFantasia: '',
        representanteNome: '',
        representanteCpf: '',
        cep: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        rg: { file: '', fileName: '', fileSize: '' },
        cnh: { file: '', fileName: '', fileSize: '' },
        cin: { file: '', fileName: '', fileSize: '' },
        cpf: { file: '', fileName: '', fileSize: '' },
        comprovanteResidencia: { file: '', fileName: '', fileSize: '' },
        comprovanteDadosBancarios: { file: '', fileName: '', fileSize: '' },
        contratoSocial: { file: '', fileName: '', fileSize: '' },
        representanteRg: { file: '', fileName: '', fileSize: '' },
        representanteCnh: { file: '', fileName: '', fileSize: '' },
        representanteCin: { file: '', fileName: '', fileSize: '' },
        representanteCpfDoc: { file: '', fileName: '', fileSize: '' },
        observacoes: '',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [activeStep, setActiveStep] = useState(0)

    // Steps dinâmicos baseados no tipo
    const getSteps = (): string[] => {
        if (!formData.cpfCnpj) {
            return ['CPF/CNPJ']
        }

        const cpf = isCPF(formData.cpfCnpj)

        if (cpf) {
            return [
                'CPF/CNPJ',
                'Dados Pessoais',
                'Endereço',
                'Documento de Identificação',
            ]
        } else {
            return [
                'CPF/CNPJ',
                'Dados da Empresa',
                'Dados do Representante',
                'Documentação',
            ]
        }
    }

    const steps = getSteps()
    const isCPFType = formData.cpfCnpj ? isCPF(formData.cpfCnpj) : false

    const MOCK_TOKEN = 'marshall-contract-form-token-2024'

    // Validar UUID do contrato ao carregar
    useEffect(() => {
        console.log('[PublicForm] useEffect executado. ContractId do useParams:', contractId)
        console.log('[PublicForm] URL completa:', window.location.href)

        const validateContract = async () => {
            if (!contractId) {
                console.log('[PublicForm] ContractId não fornecido')
                setNotFound(true)
                setLoading(false)
                return
            }

            console.log('[PublicForm] Validando contrato:', contractId)
            try {
                const result = await contractsService.validateContractUuid(contractId)
                console.log('[PublicForm] Resultado da validação:', result)
                if (result.valid) {
                    setValid(true)
                } else {
                    console.log('[PublicForm] Contrato inválido:', result.message)
                    setNotFound(true)
                }
            } catch (error: any) {
                console.error('[PublicForm] Erro ao validar contrato:', error)
                console.error('[PublicForm] Detalhes do erro:', {
                    message: error?.message,
                    status: error?.status,
                    stack: error?.stack,
                })
                setNotFound(true)
            } finally {
                setLoading(false)
            }
        }

        validateContract()
    }, [contractId])

    // Handler para quando o CEP for buscado
    const handleCepFetched = (address: {
        street: string
        neighborhood: string
        city: string
        state: string
        complement: string
    }) => {
        setFormData(prev => ({
            ...prev,
            endereco: address.street || '',
            bairro: address.neighborhood || '',
            cidade: address.city || '',
            estado: address.state || '',
            complemento: address.complement || prev.complemento,
        }))
    }

    // Validação por step
    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {}

        if (step === 0) {
            // CPF/CNPJ
            if (!formData.cpfCnpj.trim()) {
                newErrors.cpfCnpj = 'CPF/CNPJ é obrigatório'
            }
        } else if (isCPFType) {
            // Validação para CPF
            if (step === 1) {
                // Dados Pessoais
                if (!formData.nomeCompleto.trim()) {
                    newErrors.nomeCompleto = 'Nome completo é obrigatório'
                }
                if (!formData.email.trim()) {
                    newErrors.email = 'E-mail é obrigatório'
                }
                if (!formData.dataNascimento) {
                    newErrors.dataNascimento = 'Data de nascimento é obrigatória'
                }
                if (!formData.estadoCivil) {
                    newErrors.estadoCivil = 'Estado civil é obrigatório'
                }
                if (!formData.nacionalidade.trim()) {
                    newErrors.nacionalidade = 'Nacionalidade é obrigatória'
                }
                if (!formData.profissao.trim()) {
                    newErrors.profissao = 'Profissão é obrigatória'
                }
            } else if (step === 2) {
                // Endereço
                if (!formData.cep.trim()) {
                    newErrors.cep = 'CEP é obrigatório'
                }
                if (!formData.endereco.trim()) {
                    newErrors.endereco = 'Endereço é obrigatório'
                }
                if (!formData.numero.trim()) {
                    newErrors.numero = 'Número é obrigatório'
                }
                if (!formData.bairro.trim()) {
                    newErrors.bairro = 'Bairro é obrigatório'
                }
                if (!formData.cidade.trim()) {
                    newErrors.cidade = 'Cidade é obrigatória'
                }
                if (!formData.estado) {
                    newErrors.estado = 'Estado é obrigatório'
                }
            } else if (step === 3) {
                // Documentos
                if (!formData.rg.file && !formData.cnh.file && !formData.cin.file) {
                    newErrors.rg = 'É obrigatório anexar RG, CNH ou CIN'
                }
                if (!formData.comprovanteResidencia.file) {
                    newErrors.comprovanteResidencia = 'Comprovante de residência é obrigatório'
                }
                if (!formData.comprovanteDadosBancarios.file) {
                    newErrors.comprovanteDadosBancarios = 'Comprovante de dados bancários é obrigatório'
                }
            }
        } else {
            // Validação para CNPJ
            if (step === 1) {
                // Dados da Empresa
                if (!formData.nomeFantasia.trim()) {
                    newErrors.nomeFantasia = 'Nome fantasia é obrigatório'
                }
                if (!formData.cep.trim()) {
                    newErrors.cep = 'CEP é obrigatório'
                }
                if (!formData.endereco.trim()) {
                    newErrors.endereco = 'Endereço é obrigatório'
                }
                if (!formData.numero.trim()) {
                    newErrors.numero = 'Número é obrigatório'
                }
                if (!formData.bairro.trim()) {
                    newErrors.bairro = 'Bairro é obrigatório'
                }
                if (!formData.cidade.trim()) {
                    newErrors.cidade = 'Cidade é obrigatória'
                }
                if (!formData.estado) {
                    newErrors.estado = 'Estado é obrigatório'
                }
            } else if (step === 2) {
                // Dados do Representante
                if (!formData.representanteNome.trim()) {
                    newErrors.representanteNome = 'Nome completo do representante é obrigatório'
                }
                if (!formData.representanteCpf.trim()) {
                    newErrors.representanteCpf = 'CPF do representante é obrigatório'
                }
            } else if (step === 3) {
                // Documentos
                if (!formData.contratoSocial.file) {
                    newErrors.contratoSocial = 'Contrato Social é obrigatório'
                }
                if (!formData.representanteRg.file && !formData.representanteCnh.file && !formData.representanteCin.file) {
                    newErrors.representanteRg = 'É obrigatório anexar RG, CNH ou CIN do representante'
                }
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const validateForm = (): boolean => {
        // Validar todos os steps
        for (let i = 0; i < steps.length; i++) {
            if (!validateStep(i)) {
                return false
            }
        }
        return true
    }

    const handleNext = async () => {
        if (!validateStep(activeStep)) {
            setToast({
                open: true,
                message: 'Por favor, preencha todos os campos obrigatórios',
                severity: 'error',
            })
            return
        }

        // Se estiver no step 0 (CPF/CNPJ), buscar dados automaticamente
        if (activeStep === 0 && formData.cpfCnpj.trim() && isCPFType) {
            setLoadingNext(true)
            try {
                const personData = await peopleService.getByCpfCnpj(formData.cpfCnpj, MOCK_TOKEN)

                // Pré-preencher dados
                setFormData(prev => ({
                    ...prev,
                    nomeCompleto: personData.name || prev.nomeCompleto,
                    dataNascimento: personData.birthDate || personData.details?.birthDate || prev.dataNascimento,
                    estadoCivil: personData.details?.maritalStatus || prev.estadoCivil,
                    nacionalidade: personData.details?.nationality || prev.nacionalidade,
                    profissao: personData.details?.occupation || prev.profissao,
                    email: personData.contacts?.find((c: any) => c.contactType === 'email')?.contactValue || prev.email,
                    cep: personData.addresses?.[0]?.postalCode || prev.cep,
                    endereco: personData.addresses?.[0]?.street || prev.endereco,
                    numero: personData.addresses?.[0]?.number || prev.numero,
                    complemento: personData.addresses?.[0]?.complement || prev.complemento,
                    bairro: personData.addresses?.[0]?.neighborhood || prev.bairro,
                    cidade: personData.addresses?.[0]?.city || prev.cidade,
                    estado: personData.addresses?.[0]?.state || prev.estado,
                }))

                setToast({
                    open: true,
                    message: 'Dados encontrados e pré-preenchidos com sucesso!',
                    severity: 'success',
                })
            } catch (error: any) {
                // Se não encontrar, apenas continua sem preencher
                console.log('Pessoa não encontrada, continuando sem pré-preenchimento')
            } finally {
                setLoadingNext(false)
            }
        }

        setActiveStep((prevStep) => prevStep + 1)
    }

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1)
    }

    // Função para formatar o tamanho do arquivo (igual às telas normais)
    const formatSize = (input: number | string) => {
        if (typeof input === 'string') return input
        const bytes = input
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleSubmit = async () => {
        if (!validateForm() || !contractId) {
            setToast({
                open: true,
                message: 'Por favor, preencha todos os campos obrigatórios',
                severity: 'error',
            })
            return
        }

        setSaving(true)
        try {
            // Preparar documentos
            const documentos: Array<{
                categoryCode: string
                file: string
                fileName?: string
                fileSize?: string
            }> = []

            if (isCPFType) {
                // Documentos para CPF
                const docList = [
                    { type: 'rg_digital', data: formData.rg },
                    { type: 'cnh_digital', data: formData.cnh },
                    { type: 'cin_digital', data: formData.cin },
                    { type: 'residencia_comprovante_digital', data: formData.comprovanteResidencia },
                    { type: 'dados_bancarios_comprovante_digital', data: formData.comprovanteDadosBancarios },
                ]

                for (const doc of docList) {
                    if (doc && doc.type && doc.data && doc.data.file && typeof doc.data.file === 'string' && doc.data.file.trim() !== '') {
                        documentos.push({
                            categoryCode: doc.type,
                            file: doc.data.file,
                            fileName: doc.data.fileName,
                            fileSize: formatSize(doc.data.fileSize),
                        })
                    }
                }

                // Chamar endpoint único que cria tudo de uma vez
                await peopleService.createFromPublicForm({
                    contractId,
                    name: formData.nomeCompleto,
                    cpfCnpj: formData.cpfCnpj,
                    birthDate: formData.dataNascimento || null,
                    maritalStatus: formData.estadoCivil,
                    nationality: formData.nacionalidade,
                    occupation: formData.profissao,
                    addressType: 'residential',
                    postalCode: formData.cep,
                    street: formData.endereco,
                    number: formData.numero,
                    complement: formData.complemento,
                    neighborhood: formData.bairro,
                    city: formData.cidade,
                    state: formData.estado,
                    email: formData.email,
                    documents: documentos.length > 0 ? documentos : undefined,
                    observacoes: formData.observacoes,
                })
            } else {
                // Para CNPJ, precisamos criar a empresa e o representante
                // Por enquanto, vamos usar o nome fantasia como name
                const docList = [
                    { type: 'contrato_social_digital', data: formData.contratoSocial },
                    { type: 'rg_digital', data: formData.representanteRg },
                    { type: 'cnh_digital', data: formData.representanteCnh },
                    { type: 'cin_digital', data: formData.representanteCin },
                ]

                for (const doc of docList) {
                    if (doc && doc.type && doc.data && doc.data.file && typeof doc.data.file === 'string' && doc.data.file.trim() !== '') {
                        documentos.push({
                            categoryCode: doc.type,
                            file: doc.data.file,
                            fileName: doc.data.fileName,
                            fileSize: formatSize(doc.data.fileSize),
                        })
                    }
                }

                await peopleService.createFromPublicForm({
                    contractId,
                    name: formData.nomeFantasia,
                    cpfCnpj: formData.cpfCnpj,
                    addressType: 'commercial',
                    postalCode: formData.cep,
                    street: formData.endereco,
                    number: formData.numero,
                    complement: formData.complemento,
                    neighborhood: formData.bairro,
                    city: formData.cidade,
                    state: formData.estado,
                    email: formData.email || `${formData.cpfCnpj.replace(/\D/g, '')}@temp.com`, // Email temporário se não fornecido
                    documents: documentos.length > 0 ? documentos : undefined,
                    observacoes: formData.observacoes,
                })
            }

            setToast({
                open: true,
                message: 'Dados salvos com sucesso!',
                severity: 'success',
            })

            // Mostrar tela de agradecimento
            setShowThankYou(true)
        } catch (error: any) {
            console.error('Erro ao salvar:', error)
            setToast({
                open: true,
                message: error?.message || 'Erro ao salvar os dados. Tente novamente.',
                severity: 'error',
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <Box className="public-form">
                <Container maxWidth="md">
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                        <CircularProgress />
                    </Box>
                </Container>
            </Box>
        )
    }

    if (notFound) {
        return <NotFound />
    }

    if (!valid) {
        return <NotFound />
    }

    // Tela de agradecimento
    if (showThankYou) {
        return (
            <ThemeProvider theme={createAppTheme('dark')}>
                <Box className="public-form">
                    <Container maxWidth="sm" className="public-form__container">
                        <Paper
                            elevation={0}
                            className="public-form__card"
                        >
                            <Stack spacing={3} alignItems="center">
                                <Box className="public-form__logo-box">
                                    <img
                                        src={logoConcordia}
                                        alt="Concordia"
                                        className="public-form__logo"
                                    />
                                </Box>

                                <CheckCircle className="public-form__success-icon" />

                                <Typography variant="h4" className="public-form__title-success">
                                    Obrigado pelo Cadastro!
                                </Typography>

                                <Typography variant="body1" className="public-form__text-success">
                                    Seus dados foram recebidos com sucesso. O processo do contrato está em andamento e você será notificado em breve sobre os próximos passos.
                                </Typography>

                                <Typography variant="body2" className="public-form__text-muted">
                                    Em caso de dúvidas, entre em contato conosco.
                                </Typography>
                            </Stack>
                        </Paper>
                    </Container>
                </Box>
            </ThemeProvider>
        )
    }

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box>
                        <Stack spacing={1.5}>
                            <CPFCNPJPicker
                                label="CPF/CNPJ"
                                value={formData.cpfCnpj}
                                onChange={(value) => {
                                    setFormData(prev => ({ ...prev, cpfCnpj: value }))
                                    if (errors.cpfCnpj) {
                                        setErrors(prev => {
                                            const newErrors = { ...prev }
                                            delete newErrors.cpfCnpj
                                            return newErrors
                                        })
                                    }
                                }}
                                fullWidth
                                required
                                error={!!errors.cpfCnpj}
                                helperText={errors.cpfCnpj}
                                autoFocus
                            />
                        </Stack>
                    </Box>
                )
            case 1:
                if (isCPFType) {
                    // Dados Pessoais para CPF
                    return (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'text.primary' }}>
                                Dados Pessoais
                            </Typography>
                            <Stack spacing={1.5}>
                                <TextPicker
                                    label="Nome Completo"
                                    value={formData.nomeCompleto}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, nomeCompleto: value }))
                                        if (errors.nomeCompleto) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.nomeCompleto
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.nomeCompleto}
                                    helperText={errors.nomeCompleto}
                                />

                                <MailPicker
                                    label="E-mail"
                                    value={formData.email}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, email: value }))
                                        if (errors.email) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.email
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.email}
                                    helperText={errors.email}
                                />

                                <DatePicker
                                    label="Data de Nascimento"
                                    value={formData.dataNascimento}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, dataNascimento: value }))
                                        if (errors.dataNascimento) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.dataNascimento
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.dataNascimento}
                                    helperText={errors.dataNascimento}
                                    forceDarkCalendar
                                />

                                <SelectPicker
                                    label="Estado Civil"
                                    value={formData.estadoCivil}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, estadoCivil: value as string }))
                                        if (errors.estadoCivil) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.estadoCivil
                                                return newErrors
                                            })
                                        }
                                    }}
                                    options={estadosCivis.map(ec => ({ label: ec.label, value: ec.value }))}
                                    fullWidth
                                    required
                                    error={!!errors.estadoCivil}
                                    helperText={errors.estadoCivil}
                                />

                                <TextPicker
                                    label="Nacionalidade"
                                    value={formData.nacionalidade}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, nacionalidade: value }))
                                        if (errors.nacionalidade) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.nacionalidade
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.nacionalidade}
                                    helperText={errors.nacionalidade}
                                />

                                <TextPicker
                                    label="Profissão"
                                    value={formData.profissao}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, profissao: value }))
                                        if (errors.profissao) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.profissao
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.profissao}
                                    helperText={errors.profissao}
                                />
                            </Stack>
                        </Box>
                    )
                } else {
                    // Dados da Empresa para CNPJ
                    return (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'text.primary' }}>
                                Dados da Empresa
                            </Typography>
                            <Stack spacing={1.5}>
                                <TextPicker
                                    label="Nome Fantasia"
                                    value={formData.nomeFantasia}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, nomeFantasia: value }))
                                        if (errors.nomeFantasia) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.nomeFantasia
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.nomeFantasia}
                                    helperText={errors.nomeFantasia}
                                />

                                <CEPPicker
                                    label="CEP"
                                    value={formData.cep}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, cep: value }))
                                        if (errors.cep) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.cep
                                                return newErrors
                                            })
                                        }
                                    }}
                                    onAddressFetched={handleCepFetched}
                                    fullWidth
                                    required
                                    error={!!errors.cep}
                                    helperText={errors.cep}
                                />

                                <TextPicker
                                    label="Endereço"
                                    value={formData.endereco}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, endereco: value }))
                                        if (errors.endereco) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.endereco
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.endereco}
                                    helperText={errors.endereco}
                                />

                                <TextPicker
                                    label="Número"
                                    value={formData.numero}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, numero: value }))
                                        if (errors.numero) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.numero
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.numero}
                                    helperText={errors.numero}
                                />

                                <TextPicker
                                    label="Complemento"
                                    value={formData.complemento}
                                    onChange={(value) => setFormData(prev => ({ ...prev, complemento: value }))}
                                    fullWidth
                                />

                                <TextPicker
                                    label="Bairro"
                                    value={formData.bairro}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, bairro: value }))
                                        if (errors.bairro) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.bairro
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.bairro}
                                    helperText={errors.bairro}
                                />

                                <TextPicker
                                    label="Cidade"
                                    value={formData.cidade}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, cidade: value }))
                                        if (errors.cidade) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.cidade
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.cidade}
                                    helperText={errors.cidade}
                                />

                                <SelectPicker
                                    label="Estado"
                                    value={formData.estado}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, estado: value as string }))
                                        if (errors.estado) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.estado
                                                return newErrors
                                            })
                                        }
                                    }}
                                    options={estadosBrasil.map(uf => ({ label: uf, value: uf }))}
                                    fullWidth
                                    required
                                    error={!!errors.estado}
                                    helperText={errors.estado}
                                />
                            </Stack>
                        </Box>
                    )
                }
            case 2:
                if (isCPFType) {
                    // Endereço para CPF
                    return (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'text.primary' }}>
                                Endereço
                            </Typography>
                            <Stack spacing={1.5}>
                                <CEPPicker
                                    label="CEP"
                                    value={formData.cep}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, cep: value }))
                                        if (errors.cep) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.cep
                                                return newErrors
                                            })
                                        }
                                    }}
                                    onAddressFetched={handleCepFetched}
                                    fullWidth
                                    required
                                    error={!!errors.cep}
                                    helperText={errors.cep}
                                />

                                <TextPicker
                                    label="Endereço"
                                    value={formData.endereco}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, endereco: value }))
                                        if (errors.endereco) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.endereco
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.endereco}
                                    helperText={errors.endereco}
                                />

                                <TextPicker
                                    label="Número"
                                    value={formData.numero}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, numero: value }))
                                        if (errors.numero) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.numero
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.numero}
                                    helperText={errors.numero}
                                />

                                <TextPicker
                                    label="Complemento"
                                    value={formData.complemento}
                                    onChange={(value) => setFormData(prev => ({ ...prev, complemento: value }))}
                                    fullWidth
                                />

                                <TextPicker
                                    label="Bairro"
                                    value={formData.bairro}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, bairro: value }))
                                        if (errors.bairro) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.bairro
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.bairro}
                                    helperText={errors.bairro}
                                />

                                <TextPicker
                                    label="Cidade"
                                    value={formData.cidade}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, cidade: value }))
                                        if (errors.cidade) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.cidade
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.cidade}
                                    helperText={errors.cidade}
                                />

                                <SelectPicker
                                    label="Estado"
                                    value={formData.estado}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, estado: value as string }))
                                        if (errors.estado) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.estado
                                                return newErrors
                                            })
                                        }
                                    }}
                                    options={estadosBrasil.map(uf => ({ label: uf, value: uf }))}
                                    fullWidth
                                    required
                                    error={!!errors.estado}
                                    helperText={errors.estado}
                                />
                            </Stack>
                        </Box>
                    )
                } else {
                    // Dados do Representante para CNPJ
                    return (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'text.primary' }}>
                                Dados do Representante da Empresa
                            </Typography>
                            <Stack spacing={1.5}>
                                <TextPicker
                                    label="Nome Completo"
                                    value={formData.representanteNome}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, representanteNome: value }))
                                        if (errors.representanteNome) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.representanteNome
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.representanteNome}
                                    helperText={errors.representanteNome}
                                />

                                <CPFCNPJPicker
                                    label="CPF"
                                    value={formData.representanteCpf}
                                    onChange={(value) => {
                                        setFormData(prev => ({ ...prev, representanteCpf: value }))
                                        if (errors.representanteCpf) {
                                            setErrors(prev => {
                                                const newErrors = { ...prev }
                                                delete newErrors.representanteCpf
                                                return newErrors
                                            })
                                        }
                                    }}
                                    fullWidth
                                    required
                                    error={!!errors.representanteCpf}
                                    helperText={errors.representanteCpf}
                                />
                            </Stack>
                        </Box>
                    )
                }
            case 3:
                if (isCPFType) {
                    // Documentos para CPF
                    return (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'text.primary' }}>
                                Documento de Identificação
                            </Typography>

                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                                anexe apenas um dos documentos abaixo (identificação com foto):
                            </Typography>

                            <Stack spacing={1.5}>
                                {(!formData.cnh.file && !formData.cin.file) && (
                                    <FileUpload
                                        label="RG (Frente, Verso ou Digital)"
                                        value={formData.rg.file}
                                        fileName={formData.rg.fileName}
                                        fileSize={formData.rg.fileSize}
                                        onChange={(file, meta) => setFormData(prev => ({
                                            ...prev,
                                            rg: {
                                                file,
                                                fileName: meta?.name || '',
                                                fileSize: meta?.size || '',
                                            }
                                        }))}
                                        fullWidth
                                        accept="image/*,application/pdf"
                                        required={!formData.cnh.file && !formData.cin.file}
                                        error={!!errors.rg}
                                        helperText={errors.rg}
                                    />
                                )}

                                {(!formData.rg.file && !formData.cin.file) && (
                                    <FileUpload
                                        label="CNH (Impressa ou Digital)"
                                        value={formData.cnh.file}
                                        fileName={formData.cnh.fileName}
                                        fileSize={formData.cnh.fileSize}
                                        onChange={(file, meta) => setFormData(prev => ({
                                            ...prev,
                                            cnh: {
                                                file,
                                                fileName: meta?.name || '',
                                                fileSize: meta?.size || '',
                                            }
                                        }))}
                                        fullWidth
                                        accept="image/*,application/pdf"
                                        required={!formData.rg.file && !formData.cin.file}
                                        error={!!errors.cnh}
                                        helperText={errors.cnh}
                                    />
                                )}

                                {(!formData.rg.file && !formData.cnh.file) && (
                                    <FileUpload
                                        label="Cart. Identidade Nacional (CIN)"
                                        value={formData.cin.file}
                                        fileName={formData.cin.fileName}
                                        fileSize={formData.cin.fileSize}
                                        onChange={(file, meta) => setFormData(prev => ({
                                            ...prev,
                                            cin: {
                                                file,
                                                fileName: meta?.name || '',
                                                fileSize: meta?.size || '',
                                            }
                                        }))}
                                        fullWidth
                                        accept="image/*,application/pdf"
                                        required={!formData.rg.file && !formData.cnh.file}
                                        error={!!errors.cin}
                                        helperText={errors.cin}
                                    />
                                )}

                                <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 1, color: 'text.primary' }}>
                                    Comprovantes
                                </Typography>

                                <FileUpload
                                    label="Comprovante de Residência"
                                    value={formData.comprovanteResidencia.file}
                                    fileName={formData.comprovanteResidencia.fileName}
                                    fileSize={formData.comprovanteResidencia.fileSize}
                                    onChange={(file, meta) => setFormData(prev => ({
                                        ...prev,
                                        comprovanteResidencia: {
                                            file,
                                            fileName: meta?.name || '',
                                            fileSize: meta?.size || '',
                                        }
                                    }))}
                                    fullWidth
                                    accept="image/*,application/pdf"
                                    required
                                    error={!!errors.comprovanteResidencia}
                                    helperText={errors.comprovanteResidencia}
                                />

                                <FileUpload
                                    label="Comp. de Dados Bancários"
                                    value={formData.comprovanteDadosBancarios.file}
                                    fileName={formData.comprovanteDadosBancarios.fileName}
                                    fileSize={formData.comprovanteDadosBancarios.fileSize}
                                    onChange={(file, meta) => setFormData(prev => ({
                                        ...prev,
                                        comprovanteDadosBancarios: {
                                            file,
                                            fileName: meta?.name || '',
                                            fileSize: meta?.size || '',
                                        }
                                    }))}
                                    fullWidth
                                    accept="image/*,application/pdf"
                                    required
                                    error={!!errors.comprovanteDadosBancarios}
                                    helperText={errors.comprovanteDadosBancarios}
                                />
                            </Stack>
                        </Box>
                    )
                } else {
                    // Documentos para CNPJ
                    return (
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'text.primary' }}>
                                Documento da Empresa
                            </Typography>
                            <Stack spacing={1.5} sx={{ mb: 4 }}>
                                <FileUpload
                                    label="Contrato Social / Requerimento de Empresário"
                                    value={formData.contratoSocial.file}
                                    fileName={formData.contratoSocial.fileName}
                                    fileSize={formData.contratoSocial.fileSize}
                                    onChange={(file, meta) => setFormData(prev => ({
                                        ...prev,
                                        contratoSocial: {
                                            file,
                                            fileName: meta?.name || '',
                                            fileSize: meta?.size || '',
                                        }
                                    }))}
                                    fullWidth
                                    accept="image/*,application/pdf"
                                    required
                                    error={!!errors.contratoSocial}
                                    helperText={errors.contratoSocial}
                                />
                            </Stack>

                            <Typography variant="h6" gutterBottom sx={{ mb: 1, color: 'text.primary' }}>
                                Documento de Identificação do Representante
                            </Typography>

                            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontStyle: 'italic' }}>
                                anexe apenas um dos documentos abaixo (identificação com foto):
                            </Typography>

                            <Stack spacing={1.5}>
                                {(!formData.representanteCnh.file && !formData.representanteCin.file) && (
                                    <FileUpload
                                        label="RG (Frente, Verso ou Digital)"
                                        value={formData.representanteRg.file}
                                        fileName={formData.representanteRg.fileName}
                                        fileSize={formData.representanteRg.fileSize}
                                        onChange={(file, meta) => setFormData(prev => ({
                                            ...prev,
                                            representanteRg: {
                                                file,
                                                fileName: meta?.name || '',
                                                fileSize: meta?.size || '',
                                            }
                                        }))}
                                        fullWidth
                                        accept="image/*,application/pdf"
                                        required={!formData.representanteCnh.file && !formData.representanteCin.file}
                                        error={!!errors.representanteRg}
                                        helperText={errors.representanteRg}
                                    />
                                )}

                                {(!formData.representanteRg.file && !formData.representanteCin.file) && (
                                    <FileUpload
                                        label="CNH (Impressa ou Digital)"
                                        value={formData.representanteCnh.file}
                                        fileName={formData.representanteCnh.fileName}
                                        fileSize={formData.representanteCnh.fileSize}
                                        onChange={(file, meta) => setFormData(prev => ({
                                            ...prev,
                                            representanteCnh: {
                                                file,
                                                fileName: meta?.name || '',
                                                fileSize: meta?.size || '',
                                            }
                                        }))}
                                        fullWidth
                                        accept="image/*,application/pdf"
                                        required={!formData.representanteRg.file && !formData.representanteCin.file}
                                        error={!!errors.representanteCnh}
                                        helperText={errors.representanteCnh}
                                    />
                                )}

                                {(!formData.representanteRg.file && !formData.representanteCnh.file) && (
                                    <FileUpload
                                        label="Cart. Identidade Nacional (CIN)"
                                        value={formData.representanteCin.file}
                                        fileName={formData.representanteCin.fileName}
                                        fileSize={formData.representanteCin.fileSize}
                                        onChange={(file, meta) => setFormData(prev => ({
                                            ...prev,
                                            representanteCin: {
                                                file,
                                                fileName: meta?.name || '',
                                                fileSize: meta?.size || '',
                                            }
                                        }))}
                                        fullWidth
                                        accept="image/*,application/pdf"
                                        required={!formData.representanteRg.file && !formData.representanteCnh.file}
                                        error={!!errors.representanteCin}
                                        helperText={errors.representanteCin}
                                    />
                                )}
                            </Stack>
                        </Box>
                    )
                }
            default:
                return null
        }
    }

    return (
        <ThemeProvider theme={createAppTheme('dark')}>
            <Box className="public-form">
                <Container maxWidth="sm" className="public-form__container">
                    <Paper
                        elevation={0}
                        className="public-form__card"
                    >
                        <Stack spacing={3}>
                            <Box className="public-form__logo-box">
                                <img
                                    src={logoConcordia}
                                    alt="Concordia"
                                    className="public-form__logo"
                                />
                            </Box>

                            {/* Barra de Progresso */}
                            <Box className="public-form__progress-box">
                                <Box className="public-form__progress-header">
                                    <Typography variant="body2" className="public-form__progress-text">
                                        Progresso: {activeStep + 1} de {steps.length}
                                    </Typography>
                                    <Typography variant="body2" className="public-form__progress-text">
                                        {Math.round((activeStep / steps.length) * 100)}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={(activeStep / steps.length) * 100}
                                    className="public-form__linear-progress"
                                />
                            </Box>

                            {/* Conteúdo do Step */}
                            <Box className="public-form__content">
                                {renderStepContent()}
                            </Box>

                            {/* Botões de Navegação */}
                            <Box className={`public-form__actions ${activeStep === 0 ? 'public-form__actions--end' : ''}`}>
                                {activeStep > 0 && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<ArrowBack />}
                                        onClick={handleBack}
                                        disabled={saving || loadingNext}
                                        className="public-form__btn public-form__btn--back"
                                    >
                                        Voltar
                                    </Button>
                                )}
                                <Stack direction="row" spacing={2}>
                                    {activeStep === steps.length - 1 ? (
                                        <Button
                                            variant="contained"
                                            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : undefined}
                                            onClick={handleSubmit}
                                            disabled={saving}
                                            className="public-form__btn public-form__btn--save"
                                        >
                                            {saving ? 'Salvando...' : 'Salvar'}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            startIcon={loadingNext ? <CircularProgress size={20} color="inherit" /> : <ArrowForward />}
                                            onClick={handleNext}
                                            disabled={saving || loadingNext}
                                            className="public-form__btn public-form__btn--next"
                                        >
                                            Avançar
                                        </Button>
                                    )}
                                </Stack>
                            </Box>
                        </Stack>
                    </Paper>
                </Container>

                <Toast
                    open={toast.open}
                    onClose={() => setToast({ open: false, message: '' })}
                    message={toast.message}
                    severity={toast.severity}
                />
            </Box>
        </ThemeProvider>
    )
}

export default ContractPublicForm
