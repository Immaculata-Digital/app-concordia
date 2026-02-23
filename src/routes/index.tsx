import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../pages/Login'
import ForgotPasswordPage from '../pages/ForgotPassword'
import DashboardPage from '../pages/Dashboard'
import InventoryPage from '../pages/Inventory'
import PeoplePage from '../pages/People'
import TeamPage from '../pages/Team'
import UsersPage from '../pages/Users'
import SettingsPage from '../pages/Settings'
import ExemploPage from '../pages/Exemplo'
import AccessGroupsPage from '../pages/AccessGroups'
import SetPasswordPage from '../pages/SetPassword'
import RemetentesPage from '../pages/Remetentes'
import ComunicacoesPage from '../pages/Comunicacoes'
import CiclosPagamentoPage from '../pages/CiclosPagamento'
import ModalidadesRentabilidadePage from '../pages/ModalidadesRentabilidade'
import ParametrizacoesPage from '../pages/Parametrizacoes'
import RelationshipTypesPage from '../pages/RelationshipTypes'
import ContractsTemplatesPage from '../pages/ContractsTemplates'
import ContatosPage from '../pages/Contatos'
import ContractsPage from '../pages/Contracts'
import ContractDashboardPage from '../pages/Contracts/components/ContractDashboardModal'
import ContractPublicFormPage from '../pages/Contracts/PublicForm'
import NotificationsPage from '../pages/Notifications'
import DocumentosPage from '../pages/Documents'
import DocumentEditorPage from '../pages/Documents/components/Editor'
import DocumentLayoutsPage from '../pages/DocumentLayouts'
import TiposRegistroPage from '../pages/TiposRegistro'
import PluvytClientsPage from '../pages/PluvytClients'
import TenantsPage from '../pages/Tenants'
import ProdutosPage from '../pages/Produtos'
import RecompensasPage from '../pages/Recompensas'
import PointTransactionsPage from '../pages/PointTransactions'
import ProdutoCategoriasPage from '../pages/ProdutoCategorias'
import CardapioItensPage from '../pages/CardapioItens'
import MesasPage from '../pages/Mesas'
import ComandasPage from '../pages/Comandas'
import ChangelogPage from '../pages/Changelog'
import NotFoundPage from '../pages/NotFound'
import MainLayout from '../components/MainLayout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import FilePreview from '../components/FilePreview'

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/account/set-password" element={<SetPasswordPage />} />
    <Route path="/contratos/form/new/:contractId" element={<ContractPublicFormPage />} />
    <Route
      element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/peoples" element={<PeoplePage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/access/access-groups" element={<AccessGroupsPage />} />
      <Route path="/comunicacoes/remetentes" element={<RemetentesPage />} />
      <Route path="/comunicacoes/comunicacoes" element={<ComunicacoesPage />} />
      <Route path="/contratos/ciclos-pagamento" element={<CiclosPagamentoPage />} />
      <Route path="/contratos/modalidades-rentabilidade" element={<ModalidadesRentabilidadePage />} />
      <Route path="/contratos/templates-contrato" element={<ContractsTemplatesPage />} />
      <Route path="/contratos" element={<ContractsPage />} />
      <Route path="/contratos/:id" element={<ContractDashboardPage />} />
      <Route
        path="/pluvyt/clientes"
        element={
          <ProtectedRoute requiredPermissions={['erp:pluvyt-clients:listar']}>
            <PluvytClientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pluvyt/recompensas"
        element={
          <ProtectedRoute requiredPermissions={['erp:recompensas:listar']}>
            <RecompensasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pluvyt/transacoes"
        element={
          <ProtectedRoute requiredPermissions={['erp:transacoes-pontos:listar']}>
            <PointTransactionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/relationship-types"
        element={
          <ProtectedRoute requiredPermissions={['erp:pessoas:tipos-relacionamento:listar']}>
            <RelationshipTypesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenants"
        element={
          <ProtectedRoute requiredPermissions={['erp:tenants:listar']}>
            <TenantsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/produtos"
        element={
          <ProtectedRoute requiredPermissions={['erp:produtos:listar']}>
            <ProdutosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/produtos/categorias"
        element={
          <ProtectedRoute requiredPermissions={['erp:produtos:categorias:listar']}>
            <ProdutoCategoriasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cardapio"
        element={
          <ProtectedRoute requiredPermissions={['erp:cardapio:itens:listar']}>
            <CardapioItensPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pedidos/mesas"
        element={
          <ProtectedRoute requiredPermissions={['erp:mesas:listar']}>
            <MesasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pedidos/comandas"
        element={
          <ProtectedRoute requiredPermissions={['erp:comandas:listar']}>
            <ComandasPage />
          </ProtectedRoute>
        }
      />
      <Route path="/parametros/parametrizacoes" element={<ParametrizacoesPage />} />
      <Route
        path="/comercial/contatos"
        element={
          <ProtectedRoute requiredPermissions={['comercial:contatos:listar']}>
            <ContatosPage />
          </ProtectedRoute>
        }
      />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/exemplo" element={<ExemploPage />} />
      <Route path="/documentos" element={<DocumentosPage />} />
      <Route path="/documentos/editor" element={<DocumentEditorPage />} />
      <Route path="/documentos/layouts" element={<DocumentLayoutsPage />} />
      <Route path="/documentos/tipos-registro" element={<TiposRegistroPage />} />
      <Route path="/changelog" element={<ChangelogPage />} />
    </Route>
    <Route
      path="/file-preview"
      element={
        <ProtectedRoute>
          <FilePreview />
        </ProtectedRoute>
      }
    />
    <Route path="/404" element={<NotFoundPage />} />
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes>

)

export default AppRoutes
