'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

// Dados de exemplo - em produção seriam carregados do banco
const data = [
  { name: 'Jan', consertos: 12 },
  { name: 'Fev', consertos: 19 },
  { name: 'Mar', consertos: 15 },
  { name: 'Abr', consertos: 25 },
  { name: 'Mai', consertos: 22 },
  { name: 'Jun', consertos: 30 },
]

export function DashboardCharts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consertos por Mês</CardTitle>
        <CardDescription>Quantidade de consertos realizados nos últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis 
              dataKey="name" 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar 
              dataKey="consertos" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
