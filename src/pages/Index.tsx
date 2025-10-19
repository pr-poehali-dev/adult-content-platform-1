import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

const IndexContent = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoResponse.json();

        const authResponse = await fetch('https://functions.poehali.dev/b0db3f19-a754-4433-b11a-f3ad966cc6a5', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: tokenResponse.access_token,
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture,
            google_id: userInfo.sub,
          }),
        });

        const userData = await authResponse.json();
        
        if (!userData.role) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          setShowLogin(false);
          setShowRoleSelection(true);
        } else {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          setShowLogin(false);
          toast({
            title: 'Добро пожаловать!',
            description: `Вы вошли как ${userData.name}`,
          });
        }
      } catch (error) {
        toast({
          title: 'Ошибка входа',
          description: 'Не удалось войти через Google',
          variant: 'destructive',
        });
      }
    },
  });

  const loginYandex = () => {
    const clientId = 'YOUR_YANDEX_CLIENT_ID';
    const redirectUri = encodeURIComponent(window.location.origin + '/yandex-callback');
    const yandexAuthUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      yandexAuthUrl,
      'Yandex Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'YANDEX_AUTH_CODE') {
        try {
          const authResponse = await fetch('https://functions.poehali.dev/d25137a4-fa31-4ec7-bd38-5439950b9e3a', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: event.data.code,
              redirect_uri: window.location.origin + '/yandex-callback'
            }),
          });

          const userData = await authResponse.json();
          
          if (authResponse.ok) {
            if (!userData.role) {
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              setShowLogin(false);
              setShowRoleSelection(true);
            } else {
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              setShowLogin(false);
              toast({
                title: 'Добро пожаловать!',
                description: `Вы вошли как ${userData.name}`,
              });
            }
          } else {
            throw new Error(userData.message || 'Auth failed');
          }
        } catch (error) {
          toast({
            title: 'Ошибка входа',
            description: 'Не удалось войти через Яндекс',
            variant: 'destructive',
          });
        }
        
        window.removeEventListener('message', messageHandler);
        if (popup) popup.close();
      }
    };

    window.addEventListener('message', messageHandler);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({
      title: 'Вы вышли',
      description: 'До скорой встречи!',
    });
  };

  const subscriptionPlans = [
    {
      name: 'Silver',
      price: '990',
      features: ['Базовый доступ к контенту', 'HD качество', 'Базовая поддержка'],
      color: 'platinum'
    },
    {
      name: 'Gold',
      price: '2990',
      features: ['Полный доступ к контенту', '4K качество', 'Приоритетная поддержка', 'Эксклюзивные материалы'],
      color: 'gold',
      popular: true
    },
    {
      name: 'Platinum',
      price: '5990',
      features: ['Безлимитный доступ', '8K качество', 'VIP поддержка 24/7', 'Ранний доступ', 'Персональные рекомендации'],
      color: 'primary'
    }
  ];

  const creators = [
    { name: 'Anastasia K.', subscribers: '125K', avatar: '👑', verified: true },
    { name: 'Victoria M.', subscribers: '98K', avatar: '💎', verified: true },
    { name: 'Elena S.', subscribers: '87K', avatar: '⭐', verified: true },
    { name: 'Maria L.', subscribers: '76K', avatar: '🌟', verified: false }
  ];

  const galleryItems = [
    { id: 1, title: 'Exclusive Set #1', views: '45K', locked: false, premium: true },
    { id: 2, title: 'Premium Collection', views: '38K', locked: true, premium: true },
    { id: 3, title: 'Elite Series', views: '52K', locked: false, premium: true },
    { id: 4, title: 'VIP Content', views: '61K', locked: true, premium: true }
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="glass-effect sticky top-0 z-50 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-gold to-primary bg-clip-text text-transparent">
            Élite
          </h1>
          
          <div className="hidden md:flex items-center gap-6">
            <Button variant="ghost" onClick={() => setActiveTab('home')} className="text-foreground hover:text-primary">
              <Icon name="Home" size={18} className="mr-2" />
              Главная
            </Button>
            <Button variant="ghost" onClick={() => setActiveTab('gallery')} className="text-foreground hover:text-primary">
              <Icon name="Image" size={18} className="mr-2" />
              Галерея
            </Button>
            <Button variant="ghost" onClick={() => setActiveTab('creators')} className="text-foreground hover:text-primary">
              <Icon name="Users" size={18} className="mr-2" />
              Профили
            </Button>
            <Button variant="ghost" onClick={() => setActiveTab('subscriptions')} className="text-foreground hover:text-primary">
              <Icon name="Crown" size={18} className="mr-2" />
              Подписки
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setActiveTab('search')} size="icon">
              <Icon name="Search" size={20} />
            </Button>
            <Button variant="ghost" onClick={() => setActiveTab('settings')} size="icon">
              <Icon name="Settings" size={20} />
            </Button>
            {user ? (
              <div className="flex items-center gap-3">
                <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
                <Button variant="ghost" onClick={logout} size="sm">
                  Выйти
                </Button>
              </div>
            ) : (
              <Button className="bg-gold hover:bg-gold/90 text-background font-medium" onClick={() => setShowLogin(true)}>
                Войти
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'home' && (
          <div className="space-y-12 animate-fade-in">
            <section className="relative overflow-hidden rounded-2xl premium-gradient p-12 md:p-20 text-center">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative z-10">
                <Badge className="mb-4 bg-gold/20 text-gold border-gold/30">Премиум платформа</Badge>
                <h2 className="text-5xl md:text-7xl font-serif font-bold mb-6 bg-gradient-to-r from-gold via-platinum to-primary bg-clip-text text-transparent">
                  Эксклюзивный контент
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Присоединяйтесь к элитному сообществу создателей и ценителей уникального контента
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button size="lg" className="bg-gold hover:bg-gold/90 text-background font-semibold text-lg px-8">
                    <Icon name="Sparkles" size={20} className="mr-2" />
                    Начать
                  </Button>
                  <Button size="lg" variant="outline" className="border-gold text-gold hover:bg-gold/10 text-lg px-8">
                    Узнать больше
                  </Button>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-3xl font-serif font-bold">Топ создателей</h3>
                <Button variant="ghost" className="text-primary">
                  Все <Icon name="ArrowRight" size={18} className="ml-2" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {creators.map((creator, idx) => (
                  <Card key={idx} className="glass-effect hover:border-gold/30 transition-all cursor-pointer group">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{creator.avatar}</div>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{creator.name}</h4>
                          {creator.verified && <Icon name="BadgeCheck" size={18} className="text-gold" />}
                        </div>
                        <p className="text-muted-foreground text-sm">{creator.subscribers} подписчиков</p>
                        <Button className="w-full mt-4 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30">
                          Подписаться
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="glass-effect p-8 rounded-2xl">
              <div className="text-center max-w-3xl mx-auto">
                <Icon name="Shield" size={48} className="mx-auto mb-4 text-gold" />
                <h3 className="text-2xl font-serif font-bold mb-4">Максимальная конфиденциальность</h3>
                <p className="text-muted-foreground mb-6">
                  Мы используем современное шифрование и передовые технологии защиты данных. 
                  Ваш контент и личная информация находятся под надёжной защитой.
                </p>
                <div className="flex gap-8 justify-center flex-wrap">
                  <div className="text-center">
                    <Icon name="Lock" size={32} className="mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">End-to-end шифрование</p>
                  </div>
                  <div className="text-center">
                    <Icon name="Eye" size={32} className="mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Контроль приватности</p>
                  </div>
                  <div className="text-center">
                    <Icon name="Server" size={32} className="mx-auto mb-2 text-primary" />
                    <p className="text-sm font-medium">Защищённые сервера</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-serif font-bold">Галерея</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Icon name="Filter" size={16} className="mr-2" />
                  Фильтры
                </Button>
                <Button variant="outline" size="sm">
                  <Icon name="SlidersHorizontal" size={16} className="mr-2" />
                  Сортировка
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryItems.map((item) => (
                <Card key={item.id} className="group cursor-pointer overflow-hidden glass-effect hover:border-gold/30 transition-all">
                  <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
                    {item.locked && (
                      <div className="absolute inset-0 backdrop-blur-md flex items-center justify-center">
                        <Icon name="Lock" size={48} className="text-gold" />
                      </div>
                    )}
                    {item.premium && (
                      <Badge className="absolute top-3 right-3 bg-gold text-background">
                        <Icon name="Crown" size={14} className="mr-1" />
                        Premium
                      </Badge>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon name="Eye" size={14} />
                        <span>{item.views}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'creators' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-4xl font-serif font-bold mb-8">Профили создателей</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creators.map((creator, idx) => (
                <Card key={idx} className="glass-effect hover:border-gold/30 transition-all">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{creator.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle>{creator.name}</CardTitle>
                          {creator.verified && <Icon name="BadgeCheck" size={20} className="text-gold" />}
                        </div>
                        <CardDescription>{creator.subscribers} подписчиков</CardDescription>
                      </div>
                      <Button size="sm" className="bg-gold hover:bg-gold/90 text-background">
                        Подписаться
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Эксклюзивный премиум контент. Регулярные обновления и персональное общение с подписчиками.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Icon name="MessageCircle" size={16} className="mr-2" />
                        Сообщение
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Icon name="Gift" size={16} className="mr-2" />
                        Поддержать
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">Выберите подписку</h2>
              <p className="text-muted-foreground text-lg">
                Получите доступ к эксклюзивному контенту премиум-качества
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {subscriptionPlans.map((plan, idx) => (
                <Card 
                  key={idx} 
                  className={`relative overflow-hidden ${plan.popular ? 'border-gold shadow-lg shadow-gold/20 scale-105' : 'glass-effect'}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gold text-background px-4 py-1 text-sm font-semibold">
                      Популярный
                    </div>
                  )}
                  <CardHeader className="text-center pb-8 pt-8">
                    <CardTitle className="text-2xl font-serif mb-2">{plan.name}</CardTitle>
                    <div className="text-4xl font-bold font-serif mb-2">
                      <span className="text-gold">{plan.price}</span>
                      <span className="text-lg text-muted-foreground font-normal"> ₽/мес</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Icon name="Check" size={20} className="text-gold mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-gold hover:bg-gold/90 text-background' : 'bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30'}`}
                      size="lg"
                      onClick={() => setSelectedPlan(plan)}
                    >
                      Выбрать план
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6 animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-4xl font-serif font-bold mb-6 text-center">Поиск</h2>
              <div className="relative">
                <Icon name="Search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Найти создателей, контент..."
                  className="pl-12 h-14 text-lg glass-effect border-gold/20 focus:border-gold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Популярные запросы</h3>
                <div className="flex flex-wrap gap-2">
                  {['Фотосеты', 'Видео', 'Эксклюзив', '4K', 'Новинки'].map((tag) => (
                    <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-gold/10 hover:border-gold">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-4xl font-serif font-bold mb-8">Настройки</h2>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Shield" size={24} className="text-gold" />
                  Приватность и безопасность
                </CardTitle>
                <CardDescription>
                  Управляйте видимостью вашего контента и данными
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="private-profile" className="text-base font-medium">Приватный профиль</Label>
                    <p className="text-sm text-muted-foreground">Только подписчики видят ваш контент</p>
                  </div>
                  <Switch id="private-profile" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="watermark" className="text-base font-medium">Водяные знаки</Label>
                    <p className="text-sm text-muted-foreground">Автоматическая защита контента</p>
                  </div>
                  <Switch id="watermark" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="download-protect" className="text-base font-medium">Защита от скачивания</Label>
                    <p className="text-sm text-muted-foreground">Запретить сохранение контента</p>
                  </div>
                  <Switch id="download-protect" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="geo-block" className="text-base font-medium">Географические ограничения</Label>
                    <p className="text-sm text-muted-foreground">Ограничить доступ по регионам</p>
                  </div>
                  <Switch id="geo-block" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="two-factor" className="text-base font-medium">Двухфакторная аутентификация</Label>
                    <p className="text-sm text-muted-foreground">Дополнительная защита аккаунта</p>
                  </div>
                  <Switch id="two-factor" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Bell" size={24} className="text-gold" />
                  Уведомления
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="new-subscribers" className="text-base font-medium">Новые подписчики</Label>
                    <p className="text-sm text-muted-foreground">Уведомления о новых подписках</p>
                  </div>
                  <Switch id="new-subscribers" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="messages" className="text-base font-medium">Сообщения</Label>
                    <p className="text-sm text-muted-foreground">Уведомления о новых сообщениях</p>
                  </div>
                  <Switch id="messages" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="tips" className="text-base font-medium">Донаты</Label>
                    <p className="text-sm text-muted-foreground">Уведомления о поддержке</p>
                  </div>
                  <Switch id="tips" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedPlan && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <Card className="glass-effect max-w-md w-full border-gold/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-serif">Оплата подписки</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedPlan(null)}>
                    <Icon name="X" size={20} />
                  </Button>
                </div>
                <CardDescription>
                  План {selectedPlan.name} — {selectedPlan.price} ₽/мес
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Номер телефона для СБП</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 999 123 45 67"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="glass-effect border-gold/20"
                  />
                  <p className="text-xs text-muted-foreground">
                    На этот номер придёт запрос на оплату через СБП
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Подписка {selectedPlan.name}</span>
                    <span>{selectedPlan.price} ₽</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Срок действия</span>
                    <span>1 месяц</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Итого</span>
                      <span className="text-gold text-lg">{selectedPlan.price} ₽</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gold hover:bg-gold/90 text-background"
                  size="lg"
                  disabled={!phoneNumber || isProcessing}
                  onClick={async () => {
                    setIsProcessing(true);
                    try {
                      const response = await fetch('https://functions.poehali.dev/a8e2dea6-bbf6-4ec4-8575-34146fdf076b', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          amount: parseInt(selectedPlan.price),
                          description: `Подписка ${selectedPlan.name} на 1 месяц`,
                          customer_phone: phoneNumber,
                          plan_name: selectedPlan.name
                        })
                      });

                      const data = await response.json();

                      if (response.ok && data.payment_url) {
                        toast({
                          title: 'Платёж создан!',
                          description: 'Откройте приложение банка для оплаты',
                        });
                        window.open(data.payment_url, '_blank');
                        setTimeout(() => {
                          setSelectedPlan(null);
                          setPhoneNumber('');
                        }, 2000);
                      } else {
                        toast({
                          title: 'Ошибка',
                          description: data.message || 'Не удалось создать платёж',
                          variant: 'destructive',
                        });
                      }
                    } catch (error) {
                      toast({
                        title: 'Ошибка сети',
                        description: 'Проверьте подключение к интернету',
                        variant: 'destructive',
                      });
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                      Обработка...
                    </>
                  ) : (
                    <>
                      <Icon name="Smartphone" size={20} className="mr-2" />
                      Оплатить через СБП
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="Shield" size={14} className="text-gold" />
                  <span>Безопасная оплата через Систему Быстрых Платежей</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showLogin && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <Card className="glass-effect max-w-md w-full border-gold/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-serif">Вход в аккаунт</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setShowLogin(false)}>
                    <Icon name="X" size={20} />
                  </Button>
                </div>
                <CardDescription>
                  Войдите для доступа к эксклюзивному контенту
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
                  size="lg"
                  onClick={() => login()}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Войти через Google
                </Button>

                <Button 
                  className="w-full bg-black hover:bg-gray-900 text-white"
                  size="lg"
                  onClick={loginYandex}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm3.9 16.5h-2.5l-3.4-5.5v5.5H7.5V7.5h2.5l3.4 5.5V7.5h2.5v9z"/>
                  </svg>
                  Войти через Яндекс
                </Button>

                <div className="text-center text-xs text-muted-foreground">
                  Нажимая "Войти", вы принимаете условия использования и политику конфиденциальности
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showRoleSelection && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <Card className="glass-effect max-w-2xl w-full border-gold/30">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-serif">Добро пожаловать в Élite!</CardTitle>
                <CardDescription className="text-base mt-2">
                  Выберите, как вы хотите использовать платформу
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="cursor-pointer hover:border-gold transition-all hover:shadow-lg group" onClick={async () => {
                    try {
                      const response = await fetch('https://functions.poehali.dev/b0db3f19-a754-4433-b11a-f3ad966cc6a5', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          user_id: user.id,
                          role: 'viewer'
                        })
                      });

                      if (response.ok) {
                        const updatedUser = { ...user, role: 'viewer' };
                        setUser(updatedUser);
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        setShowRoleSelection(false);
                        toast({
                          title: 'Добро пожаловать!',
                          description: 'Вы можете смотреть эксклюзивный контент',
                        });
                      }
                    } catch (error) {
                      toast({
                        title: 'Ошибка',
                        description: 'Не удалось сохранить выбор',
                        variant: 'destructive',
                      });
                    }
                  }}>
                    <CardHeader>
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-primary/20 transition-colors">
                        <Icon name="Eye" size={32} className="text-primary" />
                      </div>
                      <CardTitle className="text-center text-xl">Я зритель</CardTitle>
                      <CardDescription className="text-center">
                        Хочу смотреть эксклюзивный контент от создателей
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Icon name="Check" size={16} className="text-gold mt-0.5 shrink-0" />
                        <span>Доступ к галерее контента</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Icon name="Check" size={16} className="text-gold mt-0.5 shrink-0" />
                        <span>Подписки на создателей</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Icon name="Check" size={16} className="text-gold mt-0.5 shrink-0" />
                        <span>Эксклюзивные материалы</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:border-gold transition-all hover:shadow-lg group" onClick={async () => {
                    try {
                      const response = await fetch('https://functions.poehali.dev/b0db3f19-a754-4433-b11a-f3ad966cc6a5', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          user_id: user.id,
                          role: 'creator'
                        })
                      });

                      if (response.ok) {
                        const updatedUser = { ...user, role: 'creator' };
                        setUser(updatedUser);
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                        setShowRoleSelection(false);
                        toast({
                          title: 'Поздравляем!',
                          description: 'Вы можете начать публиковать свой контент',
                        });
                      }
                    } catch (error) {
                      toast({
                        title: 'Ошибка',
                        description: 'Не удалось сохранить выбор',
                        variant: 'destructive',
                      });
                    }
                  }}>
                    <CardHeader>
                      <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-gold/20 transition-colors">
                        <Icon name="Upload" size={32} className="text-gold" />
                      </div>
                      <CardTitle className="text-center text-xl">Я создатель</CardTitle>
                      <CardDescription className="text-center">
                        Хочу публиковать свой контент и зарабатывать
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Icon name="Check" size={16} className="text-gold mt-0.5 shrink-0" />
                        <span>Загрузка контента</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Icon name="Check" size={16} className="text-gold mt-0.5 shrink-0" />
                        <span>Монетизация подписок</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Icon name="Check" size={16} className="text-gold mt-0.5 shrink-0" />
                        <span>Аналитика и статистика</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Вы сможете изменить роль позже в настройках профиля
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-serif font-bold bg-gradient-to-r from-gold to-primary bg-clip-text text-transparent mb-4">
                Élite
              </h3>
              <p className="text-sm text-muted-foreground">
                Премиум платформа для эксклюзивного контента
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Платформа</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">О нас</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Блог</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Карьера</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Поддержка</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Помощь</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Безопасность</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Правила</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Юридическая информация</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Условия использования</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Конфиденциальность</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookie</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2024 Élite. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Index = () => {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com">
      <IndexContent />
    </GoogleOAuthProvider>
  );
};

export default Index;