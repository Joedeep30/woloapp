
import { NextRequest } from 'next/server';
import { requestMiddleware } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { hashString } from '@/lib/server-utils';
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';

// Administrateurs par défaut
const DEFAULT_ADMINS = [
  // Super Administrateurs
  {
    username: 'jeff.wolo',
    email: 'jeff@wolosenegal.com',
    password: 'Jeff2025!Wolo',
    first_name: 'Jeff',
    last_name: 'WOLO',
    admin_type: 'super_admin'
  },
  {
    username: 'nat.wolo',
    email: 'nat@wolosenegal.com',
    password: 'Nat2025!Wolo',
    first_name: 'Nat',
    last_name: 'WOLO',
    admin_type: 'super_admin'
  },
  {
    username: 'nico.wolo',
    email: 'nico@wolosenegal.com',
    password: 'Nico2025!Wolo',
    first_name: 'Nico',
    last_name: 'WOLO',
    admin_type: 'super_admin'
  },
  // Administrateurs Développeurs
  {
    username: 'john.dev',
    email: 'john@wolosenegal.com',
    password: 'John2025!Dev',
    first_name: 'John',
    last_name: 'Developer',
    admin_type: 'developer_admin'
  },
  {
    username: 'mamefatou.dev',
    email: 'mamefatou@wolosenegal.com',
    password: 'Mamefatou2025!Dev',
    first_name: 'Mamefatou',
    last_name: 'Developer',
    admin_type: 'developer_admin'
  }
];

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    // Utiliser un token admin pour les opérations CRUD
    const adminToken = await generateAdminUserToken();
    const woloAdminsCrud = new CrudOperations('wolo_admins', adminToken);

    const createdAdmins = [];
    const skippedAdmins = [];

    for (const adminData of DEFAULT_ADMINS) {
      try {
        // Vérifier si l'admin existe déjà
        const existingAdmin = await woloAdminsCrud.findMany({
          username: adminData.username
        });

        if (existingAdmin && existingAdmin.length > 0) {
          skippedAdmins.push({
            username: adminData.username,
            reason: 'Existe déjà'
          });
          continue;
        }

        // Hasher le mot de passe
        const hashedPassword = await hashString(adminData.password);

        // Créer l'administrateur
        const newAdmin = await woloAdminsCrud.create({
          ...adminData,
          password: hashedPassword,
          is_active: true
        });

        // Ajouter à la liste des créés (sans le mot de passe)
        const { password, ...safeAdmin } = newAdmin;
        createdAdmins.push(safeAdmin);

      } catch (error) {
        console.error(`Erreur lors de la création de ${adminData.username}:`, error);
        skippedAdmins.push({
          username: adminData.username,
          reason: 'Erreur lors de la création'
        });
      }
    }

    return createSuccessResponse({
      created: createdAdmins,
      skipped: skippedAdmins,
      summary: {
        total_attempted: DEFAULT_ADMINS.length,
        created_count: createdAdmins.length,
        skipped_count: skippedAdmins.length
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'initialisation des admins par défaut:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de l\'initialisation des administrateurs par défaut',
      status: 500,
    });
  }
}, false);
