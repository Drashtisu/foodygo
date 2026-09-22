import React from 'react';
import { UtensilsCrossed, Server, Cpu, ShieldCheck, Activity } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-slate-900">
                Foody<span className="text-orange-600">Go</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              Enterprise-grade Event-Driven Microservices Food Delivery Architecture built with Express.js, MongoDB, Apache Kafka, and React with Tailwind CSS.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                <Server className="w-3 h-3 text-orange-600" /> Gateway: 8000
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                <Cpu className="w-3 h-3 text-emerald-600" /> Kafka Broker: 9092
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                <Activity className="w-3 h-3 text-blue-600" /> Kafka-UI: 8085
              </span>
            </div>
          </div>

         
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Microservices (8)
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>API Gateway (:8000)</li>
              <li>Auth Service (:8001)</li>
              <li>Restaurant Service (:8002)</li>
              <li>Order Service (:8003)</li>
              <li>Payment Service (:8004)</li>
              <li>Delivery Service (:8005)</li>
              <li>Notification Service (:8006)</li>
              <li>Support Service (:8007)</li>
            </ul>
          </div>

          {/* Architecture Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Event Architecture
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>Payment Success & Invoicing</li>
              <li>Kitchen Preparation Kafka Events</li>
              <li>Delivery Dispatch & Tracking</li>
              <li>2-Way Transaction Simulation</li>
              <li>Automated Support Escalation</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} FoodyGo Event-Driven Microservices. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Fast • Decoupled • Scalable</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
