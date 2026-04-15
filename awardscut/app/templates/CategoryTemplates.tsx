'use client';

import { templates, typeLabels, typeColors, type Template } from '@/lib/templatesData';
import { motion } from 'framer-motion';
import { Star, Crown, Check } from 'lucide-react';
import { useState } from 'react';

interface CategoryTemplatesProps {
  categoryType: 'corporate' | 'modern' | 'luxury' | 'minimal' | 'event' | 'social';
}

export default function CategoryTemplates({ categoryType }: CategoryTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  const categoryTemplates = templates.filter(t => t.type === categoryType);
  const categoryLabel = typeLabels[categoryType];

  if (categoryTemplates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No templates found in this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {categoryLabel} Templates
        </h1>
        <p className="text-muted-foreground">
          {categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''} available in the {categoryLabel} category
        </p>
      </motion.div>

      {/* Templates Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryTemplates.map((template, index) => {
          const isSelected = selectedTemplate === template.id;

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              onClick={() => setSelectedTemplate(template.id)}
              className={`relative p-4 rounded-2xl bg-card border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-600 shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)]'
                  : 'border-border/50 hover:border-border'
              }`}
            >
              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
                {template.popular && (
                  <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1">
                    <Star className="h-3 w-3" /> Popular
                  </span>
                )}
                {template.proOnly && (
                  <span className="px-2 py-1 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center gap-1">
                    <Crown className="h-3 w-3" /> PRO
                  </span>
                )}
              </div>

              {/* Status Badge */}
              {template.status === 'default' && (
                <div className="absolute top-4 left-4 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium z-10">
                  Default
                </div>
              )}

              {/* Preview Thumbnail */}
              <div 
                className={`aspect-video rounded-xl bg-gradient-to-br ${template.gradient} mb-4 flex items-center justify-center relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-amber-500/5" />
                
                <div className="relative z-10 text-center">
                  <div className="text-2xl font-bold text-white/40">
                    {template.name.split(' ')[0]}
                  </div>
                </div>
                
                {/* Selected indicator */}
                {isSelected && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-2 left-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg"
                  >
                    <Check className="h-5 w-5 text-white" />
                  </motion.div>
                )}
              </div>

              {/* Info */}
              <h3 className="text-lg font-semibold text-foreground mb-1">{template.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

              {/* Features */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.features.slice(0, 2).map((feature, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                    {feature}
                  </span>
                ))}
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border/30 pt-3">
                <span>{template.animationStyle}</span>
                <span>•</span>
                <span>{template.fontStyle}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
