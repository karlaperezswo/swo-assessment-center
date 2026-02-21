import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BriefingSession } from '@/types/assessment';
import { Presentation, Plus, Calendar, Users, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BriefingsWorkshopsProps {
  sessions: BriefingSession[];
  onSessionsChange: (sessions: BriefingSession[]) => void;
}

const sessionTypeLabels = {
  briefing: { label: 'Briefing', color: 'bg-blue-100 text-blue-700' },
  workshop: { label: 'Workshop', color: 'bg-purple-100 text-purple-700' },
  'deep-dive': { label: 'Deep Dive', color: 'bg-orange-100 text-orange-700' },
};

const statusIcons = {
  planned: { icon: Clock, color: 'text-yellow-500' },
  completed: { icon: CheckCircle, color: 'text-green-500' },
  cancelled: { icon: XCircle, color: 'text-red-500' },
};

export function BriefingsWorkshops({ sessions, onSessionsChange }: BriefingsWorkshopsProps) {
  const [showForm, setShowForm] = useState(false);
  const [newSession, setNewSession] = useState<Partial<BriefingSession>>({
    title: '',
    type: 'briefing',
    date: new Date().toISOString().split('T')[0],
    status: 'planned',
    attendees: 0,
    notes: '',
  });

  const handleAdd = () => {
    if (!newSession.title) return;
    const session: BriefingSession = {
      id: `bs-${Date.now()}`,
      title: newSession.title || '',
      type: newSession.type as BriefingSession['type'],
      date: newSession.date || '',
      status: newSession.status as BriefingSession['status'],
      attendees: newSession.attendees || 0,
      notes: newSession.notes || '',
    };
    onSessionsChange([...sessions, session]);
    setNewSession({ title: '', type: 'briefing', date: new Date().toISOString().split('T')[0], status: 'planned', attendees: 0, notes: '' });
    setShowForm(false);
  };

  const handleRemove = (id: string) => {
    onSessionsChange(sessions.filter(s => s.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    onSessionsChange(sessions.map(s => {
      if (s.id !== id) return s;
      const next = s.status === 'planned' ? 'completed' : s.status === 'completed' ? 'cancelled' : 'planned';
      return { ...s, status: next };
    }));
  };

  const completedCount = sessions.filter(s => s.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Intro */}
      <Card className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border-fuchsia-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Presentation className="h-6 w-6 text-fuchsia-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-fuchsia-900 text-lg">Briefings & Workshops</h3>
              <p className="text-sm text-fuchsia-700 mt-1">
                Track executive briefings, technical workshops, and deep-dive sessions to build organizational
                alignment and understanding of the migration journey.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-fuchsia-600">{sessions.length}</p>
            <p className="text-xs text-gray-500">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{sessions.filter(s => s.status === 'planned').length}</p>
            <p className="text-xs text-gray-500">Planned</p>
          </CardContent>
        </Card>
      </div>

      {/* Session list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Sessions</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-fuchsia-600 hover:bg-fuchsia-700">
            <Plus className="h-4 w-4 mr-1" /> Add Session
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add form */}
          {showForm && (
            <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-lg p-4 space-y-3">
              <Input
                placeholder="Session title"
                value={newSession.title}
                onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-3">
                <select
                  className="border rounded-md px-3 py-2 text-sm"
                  value={newSession.type}
                  onChange={(e) => setNewSession({ ...newSession, type: e.target.value as BriefingSession['type'] })}
                >
                  <option value="briefing">Briefing</option>
                  <option value="workshop">Workshop</option>
                  <option value="deep-dive">Deep Dive</option>
                </select>
                <Input
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Attendees"
                  value={newSession.attendees || ''}
                  onChange={(e) => setNewSession({ ...newSession, attendees: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAdd} className="bg-fuchsia-600 hover:bg-fuchsia-700">Add</Button>
              </div>
            </div>
          )}

          {/* Sessions */}
          {sessions.length === 0 && !showForm && (
            <p className="text-sm text-gray-400 text-center py-8">No sessions scheduled yet. Click "Add Session" to start tracking.</p>
          )}

          {sessions.map((session) => {
            const StatusIcon = statusIcons[session.status].icon;
            return (
              <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <button onClick={() => handleToggleStatus(session.id)} className="flex-shrink-0">
                  <StatusIcon className={cn('h-5 w-5', statusIcons[session.status].color)} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('font-medium text-sm', session.status === 'cancelled' && 'line-through text-gray-400')}>
                      {session.title}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', sessionTypeLabels[session.type].color)}>
                      {sessionTypeLabels[session.type].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{session.date}</span>
                    {session.attendees > 0 && (
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{session.attendees}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleRemove(session.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
