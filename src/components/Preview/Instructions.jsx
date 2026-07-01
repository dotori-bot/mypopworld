import React from 'react';
import useCardStore from '../../store/useCardStore';
import { Scissors, Palette, Tent, HelpCircle } from 'lucide-react';

export default function Instructions() {
  const { cardParams } = useCardStore();

  if (!cardParams) {
    return (
      <div className="preview-content" style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--text-secondary)' }}>
        도안 생성을 완료하면 이곳에 조립 설명서가 나타납니다.
      </div>
    );
  }

  const renderSteps = () => {
    switch (cardParams.mechanism) {
      case 'straw-rocket':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>오리기</h4>
                <p>검은색 실선을 따라 튜브 모양과 장식 그림을 조심해서 오려주세요.</p>
                <Scissors className="step-icon" />
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>튜브 말아 붙이기</h4>
                <p>가장 긴 네모(튜브)를 둥글게 말아서 '풀칠' 부분에 풀이나 양면테이프를 발라 원통 모양으로 붙여주세요.</p>
                <Palette className="step-icon" />
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>윗부분 막기</h4>
                <p>튜브 위쪽의 작은 날개를 산접기(빨간 점선)하여 뚜껑을 덮듯 풀칠해 막아주세요. (바람이 새지 않게 꼼꼼히!)</p>
                <Tent className="step-icon" />
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">4</div>
              <div className="step-content">
                <h4>장식 붙이고 날리기!</h4>
                <p>완성된 튜브 앞/뒷면에 장식을 붙인 후, 아래 뚫린 구멍으로 일반 빨대를 꽂고 후~ 불어보세요!</p>
                <HelpCircle className="step-icon" />
              </div>
            </div>
          </>
        );
      
      case 'box-popup':
      case 'v-fold':
      case 'parallel-fold':
      case 'pull-tab':
        return (
          <>
            <div className="instruction-step card">
              <div className="step-badge">1</div>
              <div className="step-content">
                <h4>오리기</h4>
                <p>검은색 실선을 따라 팝업 조각들을 모두 오려주세요.</p>
                <Scissors className="step-icon" />
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">2</div>
              <div className="step-content">
                <h4>접기</h4>
                <p>빨간 점선은 산접기(볼록하게), 파란 점선은 골접기(오목하게) 해줍니다.</p>
                <Tent className="step-icon" />
              </div>
            </div>
            <div className="instruction-step card">
              <div className="step-badge">3</div>
              <div className="step-content">
                <h4>풀칠하여 조립하기</h4>
                <p>안내된 풀칠 기호에 맞춰 배경 카드에 팝업 조각을 붙여주세요.</p>
                <Palette className="step-icon" />
              </div>
            </div>
          </>
        );

      default:
        return <p>설명서가 준비되지 않은 메커니즘입니다.</p>;
    }
  };

  return (
    <div className="preview-content" style={{ overflowY: 'auto', padding: 'var(--space-xl)' }}>
      <h3 style={{ marginBottom: 'var(--space-lg)' }}>{cardParams.theme} - 조립 설명서</h3>
      <div className="instructions-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {renderSteps()}
      </div>
    </div>
  );
}
