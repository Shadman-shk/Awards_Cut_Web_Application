'use client';

import { templates, typeLabels, typeColors, type Template } from '@/lib/templatesData';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Crown, Check, Eye, Sparkles } from 'lucide-react';

export default function TemplatesGrid() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('1');
  const [filterType, setFilterType] = useState<string | null>(null);

  const filteredTemplates = filterType 
    ? templates.filter(t => t.type === filterType)
    : templates;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: index * 0.05 }
    }),
    hover: { 
      y: -8, 
      transition: { duration: 0.2 } 
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3 mb-2">
          All Templates
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="h-6 w-6 text-amber-500" />
          </motion.span>
        </h1>
        <p className="text-muted-foreground">Choose the perfect template for your award videos</p>
      </motion.div>

      {/* Type Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-wrap gap-2 justify-center"
      >
        <button
          onClick={() => setFilterType(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filterType === null
              ? 'bg-blue-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All Templates
        </button>
        {Object.entries(typeLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilterType(filterType === key ? null : key)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterType === key
                ? 'bg-blue-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* Templates Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => {
          const isSelected = selectedTemplate === template.id;

          return (
            <motion.div
              key={template.id}
              custom={index}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              variants={cardVariants}
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
                  <motion.div 
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-600 transition-all duration-300 shadow-lg"
                  >
                    <Eye className="h-5 w-5 text-white ml-0.5" />
                  </motion.div>
                  <span className="text-sm text-muted-foreground font-medium">Preview</span>
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

              {/* Type Badge */}
              <div className="mb-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[template.type]}`}>
                  {typeLabels[template.type]}
                </span>
              </div>

              {/* Info */}
              <h3 className="text-lg font-semibold text-foreground mb-1">{template.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{template.description}</p>

              {/* Features */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.features.slice(0, 3).map((feature, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
                    {feature}
                  </span>
                ))}
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border/30 pt-3">
                <span>{template.fontStyle}</span>
                <span>•</span>
                <span>{template.animationStyle}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
