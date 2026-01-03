'use client';
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  competitionName: string;
  date: string;
  time: string;
  venue: string;
  seat: string;
  category: 'standard' | 'premium' | 'vip';
  price: number;
  purchaseDate: string;
  status: 'valid' | 'used' | 'cancelled';
  qrCode: string;
}

interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  competitions: Competition[];
  ticketsAvailable: number;
  ticketPrice: number;
  categories: TicketCategory[];
}

interface Competition {
  id: string;
  name: string;
  type: string;
  athletes: string[];
  startTime: string;
}

interface TicketCategory {
  type: 'standard' | 'premium' | 'vip';
  price: number;
  benefits: string[];
  available: number;
}

// Données simulées pour la démonstration
const mockTickets: Ticket[] = [
  {
    id: 'TICKET-001',
    eventId: 'EVENT-001',
    eventName: 'Finales de Natation - Jour 1',
    competitionName: '100m Nage Libre Hommes',
    date: '2024-07-25',
    time: '14:00',
    venue: 'Stade Nautique Olympique',
    seat: 'A-15',
    category: 'premium',
    price: 75,
    purchaseDate: '2024-07-15',
    status: 'valid',
    qrCode: 'TICKET-001-USER-123-20240725'
  },
  {
    id: 'TICKET-002',
    eventId: 'EVENT-002',
    eventName: 'Compétition d\'Athlétisme',
    competitionName: 'Saut en Hauteur Femmes',
    date: '2024-07-26',
    time: '10:30',
    venue: 'Stade Olympique',
    seat: 'B-22',
    category: 'standard',
    price: 45,
    purchaseDate: '2024-07-10',
    status: 'valid',
    qrCode: 'TICKET-002-USER-123-20240726'
  },
  {
    id: 'TICKET-003',
    eventId: 'EVENT-003',
    eventName: 'Finales de Cyclisme',
    competitionName: 'Course sur Piste - Sprint',
    date: '2024-07-24',
    time: '16:00',
    venue: 'Vélodrome National',
    seat: 'VIP-03',
    category: 'vip',
    price: 120,
    purchaseDate: '2024-07-05',
    status: 'used',
    qrCode: 'TICKET-003-USER-123-20240724'
  }
];

const mockEvents: Event[] = [
  {
    id: 'EVENT-004',
    name: 'Épreuves de Triathlon',
    date: '2024-07-28',
    time: '08:00',
    venue: 'Parc Triathlon',
    ticketsAvailable: 150,
    ticketPrice: 60,
    categories: [
      { type: 'standard', price: 60, benefits: ['Accès standard', 'Siège numéroté'], available: 100 },
      { type: 'premium', price: 90, benefits: ['Accès prioritaire', 'Siège premium', 'Rafraîchissement offert'], available: 40 },
      { type: 'vip', price: 150, benefits: ['Accès VIP', 'Parking réservé', 'Buffet', 'Rencontre avec les athlètes'], available: 10 }
    ],
    competitions: [
      { id: 'COMP-001', name: 'Triathlon Hommes', type: 'Triathlon', athletes: ['Martin Dubois', 'Jean Leroy'], startTime: '08:30' },
      { id: 'COMP-002', name: 'Triathlon Femmes', type: 'Triathlon', athletes: ['Sophie Martin', 'Marie Dubois'], startTime: '11:00' }
    ]
  },
  {
    id: 'EVENT-005',
    name: 'Finales de Gymnastique',
    date: '2024-07-29',
    time: '19:30',
    venue: 'Palais des Sports',
    ticketsAvailable: 80,
    ticketPrice: 85,
    categories: [
      { type: 'standard', price: 85, benefits: ['Accès standard', 'Siège numéroté'], available: 50 },
      { type: 'premium', price: 130, benefits: ['Accès prioritaire', 'Siège premium', 'Programme officiel'], available: 25 },
      { type: 'vip', price: 200, benefits: ['Accès VIP', 'Rencontre exclusive', 'Photos avec les gymnastes'], available: 5 }
    ],
    competitions: [
      { id: 'COMP-003', name: 'Barres Parallèles Hommes', type: 'Gymnastique', athletes: ['Thomas Bernard', 'Alexandre Petit'], startTime: '20:00' },
      { id: 'COMP-004', name: 'Poutre Femmes', type: 'Gymnastique', athletes: ['Camille Laurent', 'Élodie Moreau'], startTime: '21:30' }
    ]
  }
];

export default function TicketPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'standard' | 'premium' | 'vip'>('standard');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'my-tickets' | 'buy-tickets'>('my-tickets');
  const [loading, setLoading] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Simuler le chargement des données
  useEffect(() => {
    // Ici, vous feriez normalement des appels API
    // setTickets(await getUserTickets());
    // setEvents(await getAvailableEvents());
  }, []);

  const handlePurchase = (eventId: string) => {
    setLoading(true);
    
    // Simuler un appel API
    setTimeout(() => {
      const event = events.find(e => e.id === eventId);
      const category = event?.categories.find(c => c.type === selectedCategory);
      
      if (event && category) {
        const newTicket: Ticket = {
          id: `TICKET-${Date.now().toString().slice(-6)}`,
          eventId: event.id,
          eventName: event.name,
          competitionName: event.competitions[0]?.name || 'Compétition principale',
          date: event.date,
          time: event.time,
          venue: event.venue,
          seat: `${String.fromCharCode(65 + Math.floor(Math.random() * 10))}-${Math.floor(Math.random() * 50) + 1}`,
          category: selectedCategory,
          price: category.price * quantity,
          purchaseDate: new Date().toISOString().split('T')[0],
          status: 'valid',
          qrCode: `TICKET-${Date.now()}-USER-${Math.random().toString(36).substr(2, 9)}`
        };
        
        setTickets([newTicket, ...tickets]);
        setPurchaseSuccess(`Votre billet pour "${event.name}" a été acheté avec succès !`);
        setActiveTab('my-tickets');
        
        // Mettre à jour la disponibilité
        setEvents(events.map(e => {
          if (e.id === eventId) {
            const updatedCategories = e.categories.map(c => {
              if (c.type === selectedCategory) {
                return { ...c, available: Math.max(0, c.available - quantity) };
              }
              return c;
            });
            
            const totalAvailable = updatedCategories.reduce((sum, c) => sum + c.available, 0);
            
            return {
              ...e,
              categories: updatedCategories,
              ticketsAvailable: totalAvailable
            };
          }
          return e;
        }));
      }
      
      setLoading(false);
    }, 1500);
  };

  const getCategoryColor = (category: Ticket['category']) => {
    switch (category) {
      case 'standard': return 'bg-gray-100 text-gray-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'vip': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Ticket['status']) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEEE d MMMM yyyy', { locale: fr });
  };

  const calculateTotal = (eventId: string, quantity: number) => {
    const event = events.find(e => e.id === eventId);
    const category = event?.categories.find(c => c.type === selectedCategory);
    return category ? category.price * quantity : 0;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billetterie</h1>
            <p className="mt-2 text-gray-600">Gérez vos billets et achetez pour les prochaines compétitions</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowScanner(true)}
              className="px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Scanner un billet
            </button>
          </div>
        </div>
      </div>

      {purchaseSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{purchaseSuccess}</p>
            </div>
            <button
              onClick={() => setPurchaseSuccess(null)}
              className="ml-auto pl-3"
            >
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Scanner un billet</h3>
                <button
                  onClick={() => setShowScanner(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-center mb-6">
                <div className="mx-auto w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <p className="text-gray-500">Simulation de scanner QR Code</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Positionnez le code QR de votre billet dans le cadre pour le scanner
                </p>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowScanner(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-tickets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-tickets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Mes billets ({tickets.filter(t => t.status === 'valid').length} valides)
              </span>
            </button>
            <button
              onClick={() => setActiveTab('buy-tickets')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'buy-tickets'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Acheter des billets
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* My Tickets Tab */}
      {activeTab === 'my-tickets' && (
        <div>
          {tickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Vous n'avez pas encore de billets</h4>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                Achetez votre premier billet pour assister aux compétitions
              </p>
              <button
                onClick={() => setActiveTab('buy-tickets')}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Acheter un billet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{ticket.eventName}</h3>
                        <p className="text-gray-600">{ticket.competitionName}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status === 'valid' ? 'Valide' : ticket.status === 'used' ? 'Utilisé' : 'Annulé'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Date et heure</p>
                        <p className="text-gray-900">{formatDate(ticket.date)} à {ticket.time}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Lieu</p>
                        <p className="text-gray-900">{ticket.venue}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Siège</p>
                        <p className="text-gray-900">{ticket.seat}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Catégorie</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                          {ticket.category === 'standard' ? 'Standard' : ticket.category === 'premium' ? 'Premium' : 'VIP'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Code QR d'entrée</p>
                          <p className="text-xs text-gray-600">À présenter à l'entrée</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="bg-white p-2 border border-gray-200 rounded-lg">
                            <QRCode
                              value={ticket.qrCode}
                              size={80}
                              level="H"
                              bgColor="#FFFFFF"
                              fgColor="#000000"
                            />
                          </div>
                          <button
                            onClick={() => {
                              // Action pour afficher le code QR en grand
                              setSelectedEvent(ticket.eventId);
                            }}
                            className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Agrandir
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {ticket.status === 'valid' && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-blue-700">
                            Ce billet est valide pour l'entrée. Présentez le code QR au contrôle.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Buy Tickets Tab */}
      {activeTab === 'buy-tickets' && (
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Événements à venir</h2>
            <p className="text-gray-600">Sélectionnez un événement pour acheter vos billets</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.name}</h3>
                    <div className="flex items-center text-gray-600 mb-3">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(event.date)} à {event.time}
                    </div>
                    <div className="flex items-center text-gray-600 mb-4">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.venue}
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Compétitions incluses:</h4>
                      <ul className="space-y-1">
                        {event.competitions.map((competition, index) => (
                          <li key={competition.id} className="text-sm text-gray-600">
                            • {competition.name} ({competition.type}) - {competition.startTime}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Choisissez votre catégorie</h4>
                    
                    <div className="space-y-4 mb-6">
                      {event.categories.map((category) => (
                        <div key={category.type} className="relative">
                          <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedCategory === category.type 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          } ${category.available === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <div className="flex items-center h-5">
                              <input
                                type="radio"
                                name={`category-${event.id}`}
                                value={category.type}
                                checked={selectedCategory === category.type}
                                onChange={() => setSelectedCategory(category.type)}
                                disabled={category.available === 0}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">
                                  {category.type === 'standard' ? 'Standard' : 
                                   category.type === 'premium' ? 'Premium' : 'VIP'}
                                </span>
                                <span className="font-semibold text-gray-900">{category.price}€</span>
                              </div>
                              <ul className="mt-2 text-sm text-gray-600">
                                {category.benefits.map((benefit, index) => (
                                  <li key={index} className="flex items-center">
                                    <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {benefit}
                                  </li>
                                ))}
                              </ul>
                              <p className="mt-2 text-sm text-gray-500">
                                {category.available > 0 ? (
                                  `${category.available} place${category.available > 1 ? 's' : ''} disponible${category.available > 1 ? 's' : ''}`
                                ) : (
                                  <span className="text-red-500">Complet</span>
                                )}
                              </p>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantité
                        </label>
                        <div className="flex items-center">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100"
                          >
                            <span className="text-lg">−</span>
                          </button>
                          <span className="w-12 h-10 flex items-center justify-center border-t border-b border-gray-300 bg-white">
                            {quantity}
                          </span>
                          <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100"
                          >
                            <span className="text-lg">+</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {calculateTotal(event.id, quantity)}€
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handlePurchase(event.id)}
                      disabled={loading || event.ticketsAvailable === 0}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        event.ticketsAvailable === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Traitement en cours...
                        </span>
                      ) : event.ticketsAvailable === 0 ? (
                        'Complet'
                      ) : (
                        `Acheter ${quantity} billet${quantity > 1 ? 's' : ''}`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Information Panel */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Informations importantes
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Votre billet numérique sera disponible immédiatement après l'achat
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Présentez le code QR à l'entrée de l'événement
              </li>
              <li className="flex items-start">
                <svg className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Les billets ne sont ni remboursables ni échangeables
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}