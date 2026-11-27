import { NotificationSettings } from "@/components/settings/notification-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-bg-muted/30 py-6">
      <div className="container mx-auto max-w-4xl space-y-5 px-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Settings</h1>
          <p className="mt-1 text-sm text-text-muted">Sign-in security and how E-kimina keeps you informed.</p>
        </div>
        <Tabs defaultValue="security">
          <TabsList>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <TabsContent value="security">
              <SecuritySettings />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationSettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  );
}
