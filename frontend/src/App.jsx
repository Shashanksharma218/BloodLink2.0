import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { CelebrationProvider } from '@/components/dashboard/CelebrationOverlay'
import { Loader2 } from 'lucide-react'

// Public
const Home = lazy(() => import('@/pages/Home'))
const VerifyCertificate = lazy(() => import('@/pages/public/VerifyCertificate'))
const VerifyEmail = lazy(() => import('@/pages/public/VerifyEmail'))
const ForgotPassword = lazy(() => import('@/pages/public/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/public/ResetPassword'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Forbidden = lazy(() => import('@/pages/Forbidden'))

// Auth redirect
const DashboardRedirect = lazy(() => import('@/pages/DashboardRedirect'))

// Donor
const DonorHome = lazy(() => import('@/pages/donor/Home'))
const DonorFeed = lazy(() => import('@/pages/donor/Feed'))
const DonorPledges = lazy(() => import('@/pages/donor/Pledges'))
const DonorDonations = lazy(() => import('@/pages/donor/Donations'))
const DonorCertificates = lazy(() => import('@/pages/donor/Certificates'))
const DonorProfile = lazy(() => import('@/pages/donor/Profile'))

// Seeker
const SeekerHome = lazy(() => import('@/pages/seeker/Home'))
const SeekerRequestList = lazy(() => import('@/pages/seeker/RequestList'))
const SeekerCreateRequest = lazy(() => import('@/pages/seeker/CreateRequest'))
const SeekerRequestDetail = lazy(() => import('@/pages/seeker/RequestDetail'))

// Hospital
const HospitalHome = lazy(() => import('@/pages/hospital/Home'))
const HospitalQueue = lazy(() => import('@/pages/hospital/Queue'))
const HospitalActive = lazy(() => import('@/pages/hospital/Active'))
const HospitalDonations = lazy(() => import('@/pages/hospital/Donations'))
const HospitalRecordDonation = lazy(() => import('@/pages/hospital/RecordDonation'))
const HospitalDonors = lazy(() => import('@/pages/hospital/Donors'))
const HospitalProfile = lazy(() => import('@/pages/hospital/Profile'))

// Account
const ChangePassword = lazy(() => import('@/pages/account/Password'))

// Shared (any authenticated role)
const Inventory = lazy(() => import('@/pages/Inventory'))

// Public blood stock search
const BloodStock = lazy(() => import('@/pages/public/BloodStock'))

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CelebrationProvider>
        <Toaster position="bottom-right" richColors closeButton />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/verify/:verificationId" element={<VerifyCertificate />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Auth redirect hub */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

            {/* Donor */}
            <Route path="/donor" element={<ProtectedRoute requiredRole="donor"><DonorHome /></ProtectedRoute>} />
            <Route path="/donor/feed" element={<ProtectedRoute requiredRole="donor"><DonorFeed /></ProtectedRoute>} />
            <Route path="/donor/pledges" element={<ProtectedRoute requiredRole="donor"><DonorPledges /></ProtectedRoute>} />
            <Route path="/donor/donations" element={<ProtectedRoute requiredRole="donor"><DonorDonations /></ProtectedRoute>} />
            <Route path="/donor/certificates" element={<ProtectedRoute requiredRole="donor"><DonorCertificates /></ProtectedRoute>} />
            <Route path="/donor/profile" element={<ProtectedRoute requiredRole="donor"><DonorProfile /></ProtectedRoute>} />

            {/* Seeker */}
            <Route path="/seeker" element={<ProtectedRoute requiredRole="seeker"><SeekerHome /></ProtectedRoute>} />
            <Route path="/seeker/requests" element={<ProtectedRoute requiredRole="seeker"><SeekerRequestList /></ProtectedRoute>} />
            <Route path="/seeker/requests/new" element={<ProtectedRoute requiredRole="seeker"><SeekerCreateRequest /></ProtectedRoute>} />
            <Route path="/seeker/requests/:id" element={<ProtectedRoute requiredRole="seeker"><SeekerRequestDetail /></ProtectedRoute>} />

            {/* Hospital */}
            <Route path="/hospital" element={<ProtectedRoute requiredRole="hospital"><HospitalHome /></ProtectedRoute>} />
            <Route path="/hospital/queue" element={<ProtectedRoute requiredRole="hospital"><HospitalQueue /></ProtectedRoute>} />
            <Route path="/hospital/active" element={<ProtectedRoute requiredRole="hospital"><HospitalActive /></ProtectedRoute>} />
            <Route path="/hospital/donations" element={<ProtectedRoute requiredRole="hospital"><HospitalDonations /></ProtectedRoute>} />
            <Route path="/hospital/donations/new" element={<ProtectedRoute requiredRole="hospital"><HospitalRecordDonation /></ProtectedRoute>} />
            <Route path="/hospital/donors" element={<ProtectedRoute requiredRole="hospital"><HospitalDonors /></ProtectedRoute>} />
            <Route path="/hospital/profile" element={<ProtectedRoute requiredRole="hospital"><HospitalProfile /></ProtectedRoute>} />

            {/* Account */}
            <Route path="/account/password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />

            {/* Shared (any role) */}
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />

            {/* Public blood stock */}
            <Route path="/blood-stock" element={<BloodStock />} />

            {/* Errors */}
            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </CelebrationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
