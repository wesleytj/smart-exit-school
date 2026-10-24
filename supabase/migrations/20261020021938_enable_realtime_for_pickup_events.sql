-- Migration: Habilitar Supabase Realtime para pickup_events
-- Objetivo: Permitir subscriptions WebSocket na tabela pickup_events
-- Contexto: Ciclo F - Sincronização em Tempo Real

-- 1. Configurar REPLICA IDENTITY FULL para que eventos de UPDATE/DELETE
--    enviem as colunas completas necessárias para avaliação da RLS policy
--    pickup_events_select_member (que usa school_id, student_enrollment_id, gate_id)
ALTER TABLE public.pickup_events REPLICA IDENTITY FULL;

-- 2. Adicionar pickup_events à publicação supabase_realtime
--    Isso habilita o envio de eventos via WebSocket para clientes autenticados
ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_events;
