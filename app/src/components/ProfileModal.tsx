import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UserProfile } from '@/types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (profile: Partial<UserProfile>) => void;
}

const LANGUAGES = [
  'Português',
  'Inglês',
  'Espanhol',
  'Francês',
  'Alemão',
  'Italiano',
  'Japonês',
  'Mandarim',
  'Russo',
  'Coreano',
  'Árabe'
];

const LEVELS = ['Iniciante', 'Intermediário', 'Avançado', 'Nativo'];

const GENDERS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'outro', label: 'Outro' }
];

export function ProfileModal({ isOpen, onClose, user, onSave }: ProfileModalProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    age: 18,
    gender: 'masculino',
    country: '',
    nativeLanguage: '',
    learningLanguages: [],
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        age: user.age,
        gender: user.gender,
        country: user.country,
        nativeLanguage: user.nativeLanguage,
        learningLanguages: user.learningLanguages || [],
        bio: user.bio
      });
    }
  }, [user]);

  const handleChange = (field: keyof UserProfile, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addLearningLanguage = () => {
    setFormData(prev => ({
      ...prev,
      learningLanguages: [
        ...(prev.learningLanguages || []),
        { language: 'Inglês', level: 'Iniciante' }
      ]
    }));
  };

  const updateLearningLanguage = (index: number, field: 'language' | 'level', value: string) => {
    setFormData(prev => ({
      ...prev,
      learningLanguages: prev.learningLanguages?.map((lang, i) =>
        i === index ? { ...lang, [field]: value } : lang
      )
    }));
  };

  const removeLearningLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      learningLanguages: prev.learningLanguages?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-violet-600" />
            Configure seu Perfil
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome de exibição *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Seu nome"
              required
            />
          </div>

          {/* Age and Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                type="number"
                min={13}
                max={100}
                value={formData.age}
                onChange={(e) => handleChange('age', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Gênero</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => handleChange('gender', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="Seu país"
            />
            <p className="text-xs text-slate-400">País detectado automaticamente pelo seu IP</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Sobre você</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Conte um pouco sobre você..."
              rows={3}
            />
          </div>

          {/* Languages Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-600" />
              <Label className="font-semibold">Idiomas</Label>
            </div>

            {/* Native Language */}
            <div className="space-y-2">
              <Label>Idioma Nativo *</Label>
              <Select 
                value={formData.nativeLanguage} 
                onValueChange={(value) => handleChange('nativeLanguage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu idioma nativo" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Learning Languages */}
            <div className="space-y-2">
              <Label>Idiomas que está aprendendo</Label>
              <AnimatePresence>
                {formData.learningLanguages?.map((lang, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Select
                      value={lang.language}
                      onValueChange={(value) => updateLearningLanguage(index, 'language', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={lang.level}
                      onValueChange={(value) => updateLearningLanguage(index, 'level', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => removeLearningLanguage(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
              <Button
                type="button"
                variant="ghost"
                className="text-violet-600 hover:text-violet-700"
                onClick={addLearningLanguage}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar idioma
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 space-y-2">
            <Button 
              type="submit" 
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              Salvar Perfil
            </Button>
            <Button 
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => {
                localStorage.removeItem('linguaconnect_user');
                window.location.reload();
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar Conta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
