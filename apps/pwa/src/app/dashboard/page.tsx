import { WeatherWidget } from '@/components/WeatherWidget';
import { TimeBasedWidget } from '@/components/TimeBasedWidget';
import { DailyRouteWidget } from '@/components/DailyRouteWidget';
import { PaymentsDueWidget } from '@/components/PaymentsDueWidget';
import { OverduePaymentsWidget } from '@/components/OverduePaymentsWidget';
import { RequestedProductsWidget } from '@/components/RequestedProductsWidget';
import { TeamInviteWidget } from '@/components/TeamInviteWidget';
import { RoleGuard } from '@/components/RoleGuard';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <TimeBasedWidget />
      <WeatherWidget />

      <RoleGuard allowedRoles={['owner']}>
        <TeamInviteWidget />
      </RoleGuard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roteiro e Vencimentos de Hoje */}
        <DailyRouteWidget />
        
        <RoleGuard allowedRoles={['solo', 'owner', 'worker']}>
          <RequestedProductsWidget />
        </RoleGuard>

        <RoleGuard allowedRoles={['solo', 'owner']}>
          <PaymentsDueWidget />
        </RoleGuard>
      </div>

      {/* Widget de Pagamentos Vencidos - pode ocupar largura total se necessário */}
      <RoleGuard allowedRoles={['solo', 'owner']}>
        <OverduePaymentsWidget />
      </RoleGuard>
    </div>
  );
}