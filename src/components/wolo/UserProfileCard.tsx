
"use client";

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types/wolo';

interface UserProfileCardProps {
  user: User;
  className?: string;
}

export function UserProfileCard({ user, className = "" }: UserProfileCardProps) {
  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    return user.email.split('@')[0];
  };

  return (
    <motion.div
      className={`flex items-center gap-3 bg-white/30 backdrop-blur-sm rounded-lg p-4 border border-white/40 shadow-lg ${className}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Avatar className="h-12 w-12 border-2 border-white/40 shadow-lg">
        <AvatarImage 
          src={user.profile_picture_url} 
          alt={getDisplayName()}
        />
        <AvatarFallback className="bg-orange-500 text-white font-semibold">
          {getInitials(user.first_name, user.last_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white drop-shadow-lg">
            {getDisplayName()}
          </h3>
          {user.is_facebook_user && (
            <Badge variant="secondary" className="bg-blue-500/30 text-blue-200 text-xs border border-blue-400/50">
              Facebook
            </Badge>
          )}
        </div>
        
        <p className="text-sm text-white/90 drop-shadow font-medium">
          {user.email}
        </p>
        
        {user.phone && (
          <p className="text-xs text-white/80 drop-shadow">
            📱 {user.phone}
          </p>
        )}
      </div>
    </motion.div>
  );
}
