"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { Navbar } from "@/src/components/layout/Navbar";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Card, CardContent } from "@/src/components/ui/Card";
import { apiClient } from "@/src/lib/api-client";
import Link from "next/link";

interface Event {
  id: number;
  name: string;
  location?: string;
  event_date?: string;
}

interface Stats {
  teams_count: number;
  staff_count: number;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { admin, token } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<Stats>({ teams_count: 0, staff_count: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const eventId = params.eventId as string;

  useEffect(() => {
    if (!admin) {
      router.push("/login");
      return;
    }
  }, [admin, router]);

  const loadEventData = useCallback(async () => {
    setIsLoading(true);

    const [eventRes, teamsRes, staffRes] = await Promise.all([
      apiClient.get<{ event: Event }>(`/api/events/${eventId}`, token!),
      apiClient.get<{ teams: unknown[]; total: number }>(
        `/api/teams?event_id=${eventId}`,
        token!
      ),
      apiClient.get<{ staff: unknown[]; total: number }>(
        `/api/staff?event_id=${eventId}`,
        token!
      ),
    ]);

    if (eventRes.data) {
      setEvent(eventRes.data.event);
    }

    if (teamsRes.data) {
      setStats((prev) => ({ ...prev, teams_count: teamsRes.data!.total }));
    }

    if (staffRes.data) {
      setStats((prev) => ({ ...prev, staff_count: staffRes.data!.total }));
    }

    setIsLoading(false);
  }, [eventId, token]);

  useEffect(() => {
    if (!token && !eventId) return;
    const fetchEventData = async () => {
      await loadEventData();
    };

    fetchEventData();
  }, [token, eventId, loadEventData]);

  if (isLoading || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Carregando...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title={event.name}
          description={event.location}
          breadcrumbs={[
            { label: "Eventos", href: "/dashboard" },
            { label: event.name },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Equipes
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.teams_count}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                  <svg
                    className="h-8 w-8 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total de Staff
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.staff_count}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <svg
                    className="h-8 w-8 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Data do Evento
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {event.event_date
                      ? new Date(event.event_date).toLocaleDateString("pt-BR")
                      : "Não definida"}
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                  <svg
                    className="h-8 w-8 text-purple-600 dark:text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href={`/events/${eventId}/teams`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                    <svg
                      className="h-8 w-8 text-blue-600 dark:text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Gerenciar Equipes
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Visualizar e gerenciar todas as equipes do evento
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/events/${eventId}/staff`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
                    <svg
                      className="h-8 w-8 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Ver Todos os Funcionários
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Relatório completo de todos os credenciados
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
